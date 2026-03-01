import * as tf from '@tensorflow/tfjs';
import {
    SENSOR_KEYS,
    SENSOR_RANGES,
    getTempStatus,
    getHumidityStatus,
    getAirStatus,
    getRainStatus,
    getLdrStatus,
    DANGER_THRESHOLDS
} from '../config/thresholds.js';

const WINDOW_SIZE = 10;   // look-back timesteps
const LSTM_UNITS = 32;
const RETRAIN_EVERY = 5;    // retrain after N new readings

// ─────────────────────────────────────────────────────────────────
//  SensorPredictor — LSTM model that trains + predicts in Node.js
// ─────────────────────────────────────────────────────────────────
class SensorPredictor {
    constructor() {
        this.model = null;
        this.buffer = [];    // rolling window of raw readings
        this.trained = false;
        this.training = false;
        this.newCount = 0;     // readings since last retrain
        this.trainLoss = null;
        this.lastPrediction = null;
    }

    // ── Build LSTM model ──────────────────────────────────────────
    _buildModel() {
        const model = tf.sequential();
        model.add(tf.layers.lstm({
            units: LSTM_UNITS,
            inputShape: [WINDOW_SIZE, SENSOR_KEYS.length],
            returnSequences: false,
        }));
        model.add(tf.layers.dropout({ rate: 0.1 }));
        model.add(tf.layers.dense({ units: SENSOR_KEYS.length }));
        model.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError' });
        return model;
    }

    // ── Min-max normalize a single reading → [0, 1] ───────────────
    _normalize(reading) {
        return SENSOR_KEYS.map(k => {
            const { min, max } = SENSOR_RANGES[k];
            return (reading[k] - min) / (max - min);
        });
    }

    // ── Denormalize a flat array back to sensor values ────────────
    _denormalize(normalized) {
        const result = {};
        SENSOR_KEYS.forEach((k, i) => {
            const { min, max } = SENSOR_RANGES[k];
            result[k] = parseFloat((normalized[i] * (max - min) + min).toFixed(2));
        });
        return result;
    }

    // ── Build training tensors from buffer ────────────────────────
    _buildDataset(readings) {
        const normalized = readings.map(r => this._normalize(r));
        const X = [], Y = [];

        for (let i = 0; i < normalized.length - WINDOW_SIZE; i++) {
            X.push(normalized.slice(i, i + WINDOW_SIZE));
            Y.push(normalized[i + WINDOW_SIZE]);
        }

        if (X.length === 0) return null;
        return {
            xs: tf.tensor3d(X, [X.length, WINDOW_SIZE, SENSOR_KEYS.length]),
            ys: tf.tensor2d(Y, [Y.length, SENSOR_KEYS.length]),
        };
    }

    // ── Initialize with historical data from DB ───────────────────
    async init(historicalReadings) {
        console.log(`🧠 [ML] Initializing LSTM model with ${historicalReadings.length} historical readings...`);
        this.model = this._buildModel();

        if (historicalReadings.length >= WINDOW_SIZE + 1) {
            this.buffer = historicalReadings.slice(-50); // keep last 50
            await this._train();
        } else {
            console.log('⚠️  [ML] Not enough data to train yet — need at least', WINDOW_SIZE + 1, 'readings');
        }
    }

    // ── Train (or retrain) the model ─────────────────────────────
    async _train() {
        if (this.training || this.buffer.length < WINDOW_SIZE + 1) return;
        this.training = true;

        try {
            const dataset = this._buildDataset(this.buffer);
            if (!dataset) { this.training = false; return; }

            const history = await this.model.fit(dataset.xs, dataset.ys, {
                epochs: 80,
                batchSize: Math.min(16, Math.floor(dataset.xs.shape[0] / 2) || 1),
                shuffle: true,
                verbose: 0,
            });

            this.trainLoss = history.history.loss.at(-1);
            this.trained = true;
            console.log(`✅ [ML] Model trained — loss: ${this.trainLoss?.toFixed(6)} — buffer: ${this.buffer.length} pts`);

            // Clean up tensors
            dataset.xs.dispose();
            dataset.ys.dispose();
        } catch (err) {
            console.error('❌ [ML] Training error:', err.message);
        } finally {
            this.training = false;
        }
    }

    // ── Add new reading + maybe retrain ──────────────────────────
    async addReading(reading) {
        this.buffer.push(reading);
        if (this.buffer.length > 50) this.buffer.shift(); // keep rolling 50

        this.newCount++;
        if (this.newCount >= RETRAIN_EVERY && !this.training) {
            this.newCount = 0;
            // retrain non-blocking
            this._train().catch(console.error);
        }

        // Always predict after adding
        return this.predict();
    }

    // ── Predict next reading using last WINDOW_SIZE readings ──────
    predict() {
        if (!this.trained || this.buffer.length < WINDOW_SIZE) {
            return null; // not ready yet
        }

        return tf.tidy(() => {
            const window = this.buffer.slice(-WINDOW_SIZE);
            const normalized = window.map(r => this._normalize(r));
            const inputTensor = tf.tensor3d([normalized], [1, WINDOW_SIZE, SENSOR_KEYS.length]);
            const outputTensor = this.model.predict(inputTensor);
            const rawValues = Array.from(outputTensor.dataSync());

            const predicted = this._denormalize(rawValues);
            const current = this.buffer.at(-1);
            const confidence = this._computeConfidence();

            // Compute per-sensor trend and time-to-threshold
            const sensors = {};
            SENSOR_KEYS.forEach(k => {
                const curr = current[k];
                const pred = predicted[k];
                const slope = pred - curr; // per-interval change

                // Use centralized logic for status classification
                const statusObj = this._getStatusResult(k, pred);

                // Calculate time to danger specifically
                const dangerThresh = DANGER_THRESHOLDS[k];
                const timeToDanger = this._minutesToThreshold(k, curr, slope, dangerThresh);

                sensors[k] = {
                    current: parseFloat(curr.toFixed(2)),
                    predicted: parseFloat(pred.toFixed(2)),
                    trend: slope > 0.05 * (SENSOR_RANGES[k].max - SENSOR_RANGES[k].min) ? 'rising' :
                        slope < -0.05 * (SENSOR_RANGES[k].max - SENSOR_RANGES[k].min) ? 'falling' : 'stable',
                    slopePerMin: parseFloat((slope * 6).toFixed(3)), // Assuming 10s intervals
                    status: statusObj.status.toLowerCase(), // Frontend expects lowercase
                    label: statusObj.label,
                    timeToDanger,
                };
            });

            this.lastPrediction = {
                timestamp: new Date().toISOString(),
                sensors,
                confidence,
                trainLoss: this.trainLoss,
                dataPoints: this.buffer.length,
                modelReady: this.trained,
            };

            return this.lastPrediction;
        });
    }

    // ── Helper to use unified status logic ─────────────────────────
    _getStatusResult(key, value) {
        switch (key) {
            case 'temperature': return getTempStatus(value);
            case 'humidity': return getHumidityStatus(value);
            case 'airQuality': return getAirStatus(value);
            case 'rainfall': return getRainStatus(value);
            case 'ldr': return getLdrStatus(value);
            default: return { status: "SAFE", label: "NORMAL" };
        }
    }

    // ── How many minutes until `key` crosses threshold ───────────
    _minutesToThreshold(key, current, slope, threshold) {
        if (slope === 0 || !threshold) return null;

        const dist = threshold - current;

        // Check if moving towards threshold
        // For rainfall, "danger" is lower than current (more rain)
        if (key === 'rainfall') {
            if (slope >= 0 || dist >= 0) return null; // already below or moving up
        } else {
            if (slope <= 0 || dist <= 0) return null; // already above or moving down
        }

        const intervalSeconds = 10; // readings every 10s
        const intervals = dist / slope;
        const minutes = (intervals * intervalSeconds) / 60;

        return minutes > 0 && minutes < 120 ? parseFloat(minutes.toFixed(1)) : null;
    }

    // ── Confidence: exponential decay of training loss ────────────
    _computeConfidence() {
        if (this.trainLoss === null || this.trainLoss === undefined) return 0;
        const conf = Math.exp(-2 * this.trainLoss) * 100;
        return parseFloat(Math.min(99, Math.max(1, conf)).toFixed(1));
    }

    getLastPrediction() {
        return this.lastPrediction;
    }

    isReady() {
        return this.trained && !this.training;
    }
}

export default SensorPredictor;
