"""
app.py  —  Python ML Prediction API (Flask)
============================================
Runs on port 5001  (Node.js occupies port 5000)

Endpoints
---------
GET  /health            — Health check
GET  /model-info        — Loaded model metadata
POST /predict           — Multi-horizon time-series forecast  ← MAIN
POST /predict/single    — Single next-step forecast (backward-compat)
POST /train             — Trigger model re-training
"""

import os
import sys
import json

from flask import Flask, request, jsonify
from flask_cors import CORS

# ── Path setup ─────────────────────────────────────────────────────────────────
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)          # …/ml/p

if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# ── Internal imports ───────────────────────────────────────────────────────────
from services.predict_service import SensorPredictor
from services.model_service import ModelService
from services.validation_service import ValidationService
from config import API_PORT, SENSOR_INTERVAL_SECONDS

# ── Flask app ──────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

# Eager-load the model once at startup — avoids disk I/O on every request
model_service = ModelService()
predictor = SensorPredictor()

try:
    model_service.load_model()
    print(f"[ML] Model loaded successfully from disk.")
except FileNotFoundError:
    print("[ML] WARNING: Model file not found. Call POST /train to train the model first.")
except Exception as e:
    print(f"[ML] ERROR loading model: {e}")

MODEL_META_FILE = os.path.join(PROJECT_ROOT, "models", "model_meta.json")


# ── Helpers ────────────────────────────────────────────────────────────────────
def _ok(payload, code=200):
    return jsonify({"status": "success", **payload}), code


def _err(message, code=400):
    return jsonify({"status": "error", "message": message}), code


def _require_json():
    """Return parsed JSON body or raise a ValueError."""
    if not request.is_json:
        raise ValueError("Content-Type must be application/json")
    data = request.get_json(silent=True)
    if data is None:
        raise ValueError("Request body is missing or contains invalid JSON")
    return data


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return _ok({
        "service": "ml-prediction-api",
        "port": API_PORT,
        "sensor_interval_seconds": SENSOR_INTERVAL_SECONDS,
        "model_loaded": model_service.model is not None,
    })


@app.route("/model-info", methods=["GET"])
def model_info():
    if not model_service.model_exists():
        return _err("Model not trained yet. Call POST /train.", 404)

    if not os.path.exists(MODEL_META_FILE):
        return _ok({"message": "Model exists but metadata file not found."})

    try:
        with open(MODEL_META_FILE, "r", encoding="utf-8") as f:
            meta = json.load(f)
        return _ok({"model_meta": meta})

    except Exception as e:
        return _err(f"Failed to read model metadata: {e}", 500)


@app.route("/predict", methods=["POST"])
def predict_multi_horizon():
    """
    Multi-horizon time-series forecast.

    Request body (JSON):
        {
            "temperature": 28.5,
            "humidity": 65.0,
            "airQuality": 300,
            "rainfall": 800,
            "ldr": 600,
            "horizons_seconds": [30, 60, 120, 300, 600]   // optional
        }

    Response:
        {
            "status": "success",
            "sensor_interval_seconds": 10,
            "horizons": [
                {
                    "horizon_seconds": 30,
                    "horizon_label": "+30s",
                    "timestamp": "2026-03-16T17:43:10+00:00",
                    "temperature": 29.1,
                    "humidity": 64.5,
                    "airQuality": 310.2,
                    "rainfall": 798.4,
                    "ldr": 601.7,
                    "status": { "temperature": "safe", ... },
                    "aqi_category": "Moderate",
                    "anomaly": false
                },
                ...
            ]
        }
    """
    try:
        data = _require_json()
        horizons_seconds = ValidationService.validate_horizons(data)
        result = predictor.predict_horizons(data, horizons_seconds=horizons_seconds)
        return _ok(result)

    except ValueError as e:
        return _err(str(e), 400)
    except FileNotFoundError as e:
        return _err(str(e), 404)
    except Exception as e:
        return _err(f"Prediction failed: {e}", 500)


@app.route("/predict/single", methods=["POST"])
def predict_single():
    """
    Single next-step prediction — backward-compatible endpoint.

    Request body (JSON):
        { "temperature": ..., "humidity": ..., "airQuality": ...,
          "rainfall": ..., "ldr": ... }

    Response:
        {
            "status": "success",
            "prediction": {
                "temperature": ..., "humidity": ..., "airQuality": ...,
                "rainfall": ..., "ldr": ...
            }
        }
    """
    try:
        data = _require_json()
        prediction = predictor.predict(data)
        return _ok({"prediction": prediction})

    except ValueError as e:
        return _err(str(e), 400)
    except FileNotFoundError as e:
        return _err(str(e), 404)
    except Exception as e:
        return _err(f"Single-step prediction failed: {e}", 500)


@app.route("/train", methods=["POST"])
def train():
    """Trigger model re-training from MongoDB data."""
    try:
        from training.train_model import train_model
        from datetime import datetime

        train_model()

        # Reload model into memory after retraining
        model_service.reload_model()

        return _ok({
            "message": "Model trained and reloaded successfully",
            "trained_at": datetime.utcnow().isoformat(),
        })

    except ValueError as e:
        return _err(str(e), 400)
    except FileNotFoundError as e:
        return _err(str(e), 404)
    except Exception as e:
        return _err(f"Training failed: {e}", 500)


# ── Entry point ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print(f"[ML] Starting prediction API on port {API_PORT} ...")
    app.run(
        host="0.0.0.0",
        port=API_PORT,
        debug=False,        # Disable debug to prevent reloader connection resets
        use_reloader=False, # File-change reloader drops in-flight requests
        threaded=True,      # Allow concurrent requests
    )