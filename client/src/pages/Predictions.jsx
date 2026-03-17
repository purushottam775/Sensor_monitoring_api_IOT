import PredictionPanel from '../components/PredictionPanel';
import SensorChart from '../components/SensorChart';
import { SENSORS } from '../config';

const SENSOR_KEYS = Object.keys(SENSORS);

export default function Predictions({ latest, history, mlPrediction, mlLoading, mlError, modelType, setModelType }) {
  const horizons = mlPrediction?.horizons || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            🔮 Predictions
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Multi-horizon ML forecast from Python {modelType === 'advanced' ? 'XGBoost' : 'RandomForest'}
          </p>
        </div>

        {/* Model Selector copy-paste from Overview for consistency */}
        <div className="flex items-center bg-slate-800/50 p-1 rounded-lg border border-white/5 self-start sm:self-center">
          <button
            onClick={() => setModelType('standard')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              modelType === 'standard' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'text-slate-400 hover:text-white'
            }`}
          >
            RF (Standard)
          </button>
          <button
            onClick={() => setModelType('advanced')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              modelType === 'advanced' 
              ? 'bg-purple-600 text-white shadow-lg' 
              : 'text-slate-400 hover:text-white'
            }`}
          >
            XGBoost (Advanced)
          </button>
        </div>
      </div>

      {/* ML Multi-horizon panel */}
      <PredictionPanel
        mlPrediction={mlPrediction}
        mlLoading={mlLoading}
        mlError={mlError}
        modelType={modelType}
      />

      {/* Per-sensor forecast bar charts */}
      {horizons.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Per-Sensor Forecast Timeline
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {SENSOR_KEYS.map(key => {
              const meta = SENSORS[key];
              // Build chart data from history + predictions
              const chartHistory = history.slice(-20); // last 20 for clarity
              return (
                <div key={key} className="p-4 rounded-2xl border border-white/8"
                     style={{ background: 'rgba(15,23,42,0.7)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span>{meta.icon}</span>
                    <h3 className="text-sm font-semibold text-white">{meta.label} Forecast</h3>
                    <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-4 h-0.5" style={{ background: meta.color }} /> Actual
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-4 border-t border-dashed" style={{ borderColor: meta.color }} /> Predicted
                      </span>
                    </div>
                  </div>
                  <SensorChart
                    sensorKey={key}
                    history={chartHistory}
                    height={160}
                    showPredictions={horizons}
                    type="line"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!mlPrediction && !mlLoading && (
        <div className="p-6 rounded-2xl border border-white/8 text-center"
             style={{ background: 'rgba(15,23,42,0.5)' }}>
          <p className="text-slate-500">No predictions available yet.</p>
          <p className="text-slate-600 text-sm mt-1">
            Send sensor data to the backend and ensure both Node.js (:5000) and Python (:5001) are running.
          </p>
        </div>
      )}
    </div>
  );
}
