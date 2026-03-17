import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone
import math
from services.model_service import ModelService
from config import SENSOR_INTERVAL_SECONDS, DEFAULT_HORIZONS

# ── Constants ──────────────────────────────────────────────────────────────────
FEATURE_ORDER = [
    "temperature", "humidity", "airQuality", "rainfall", "ldr",
    "hour_sin", "hour_cos", "min_sin", "min_cos",
    "temperature_lag1", "humidity_lag1", "airQuality_lag1", "rainfall_lag1", "ldr_lag1"
]

# AQI classification thresholds
AQI_CATEGORIES = [
    (500,   "Good",       "safe"),
    (1000,  "Moderate",   "safe"),
    (1500,  "Unhealthy",  "warning"),
    (2500,  "Very Unhealthy", "warning"),
    (4095,  "Hazardous",  "danger"),
]

# SAFE / WARNING / DANGER thresholds for each sensor
STATUS_THRESHOLDS = {
    "temperature": [
        (-20, 10,  "danger"),
        (10,  15,  "warning"),
        (15,  35,  "safe"),
        (35,  40,  "warning"),
        (40,  80,  "danger"),
    ],
    "humidity": [
        (0,   20,  "warning"),
        (20,  80,  "safe"),
        (80,  100, "warning"),
    ],
    "airQuality": [
        (0,    500,  "safe"),
        (500,  1500, "warning"),
        (1500, 4095, "danger"),
    ],
    "rainfall": [
        # Lower ADC value = more rain
        (0,    400,  "danger"),
        (400,  1200, "warning"),
        (1200, 4095, "safe"),
    ],
    "ldr": [
        # Lower = darker environment
        (0,    300,  "warning"),
        (300,  4095, "safe"),
    ],
}


def _get_sensor_status(field, value):
    ranges = STATUS_THRESHOLDS.get(field, [])
    for lo, hi, status in ranges:
        if lo <= value <= hi:
            return status
    return "unknown"


def _get_aqi_category(air_quality_raw):
    for threshold, label, _ in AQI_CATEGORIES:
        if air_quality_raw <= threshold:
            return label
    return "Hazardous"


def _label_for_seconds(seconds):
    if seconds < 60:
        return f"+{seconds}s"
    elif seconds < 3600:
        mins = seconds // 60
        secs = seconds % 60
        return f"+{mins}min" + (f" {secs}s" if secs else "")
    else:
        hours = seconds // 3600
        return f"+{hours}hr"


class AdvancedPredictor:
    def __init__(self):
        self.model_service = ModelService()

    def _prepare_features(self, sensor_dict, timestamp):
        """Prepare advanced features (Sin/Cos time + Lags) for a single prediction step."""
        d = sensor_dict.copy()
        
        # Add Sin/Cos time
        hour = timestamp.hour
        minute = timestamp.minute
        d['hour_sin'] = np.sin(2 * np.pi * hour / 24)
        d['hour_cos'] = np.cos(2 * np.pi * hour / 24)
        d['min_sin'] = np.sin(2 * np.pi * minute / 60)
        d['min_cos'] = np.cos(2 * np.pi * minute / 60)
        
        # Lag 1: In the rollout, lag1 of step t+1 is the value at step t.
        # This function expects 'sensor_dict' to ALREADY contain lag features if coming from the real world,
        # OR we inject them here if we are rolling out.
        # For simplicity in rollout, we assume the input sensor_dict HAS the current values
        # and we need to provide the lags based on the LAST step.
        
        return d

    def predict_horizons(self, data, horizons_seconds=None):
        if horizons_seconds is None:
            horizons_seconds = DEFAULT_HORIZONS
            
        model = self.model_service.get_model()
        now_utc = datetime.now(timezone.utc)
        
        # Initial state
        # Input should have: temperature, humidity, airQuality, rainfall, ldr
        current_sensors = {k: data[k] for k in ["temperature", "humidity", "airQuality", "rainfall", "ldr"]}
        
        # For the very first step, we use the current sensors as lag1 for the next step
        # This is a simplification: usually we'd need the REAL lag1 from history.
        # But for rollout, we can assume the current state is the "previous" state for the next prediction.
        
        # Prepare features for NumPy rollout
        # Order: temp, hum, aqi, rain, ldr, h_sin, h_cos, m_sin, m_cos, t_l, h_l, a_l, r_l, l_l
        feat_arr = np.zeros(14)
        for i, col in enumerate(["temperature", "humidity", "airQuality", "rainfall", "ldr"]):
            feat_arr[i] = data[col]           # current values
            feat_arr[i+9] = data[col]         # initial lags (simplified)
            
        max_steps = min(60, math.ceil(max(horizons_seconds) / SENSOR_INTERVAL_SECONDS))
        step_predictions = {}
        
        for step in range(1, max_steps + 1):
            step_time = now_utc + timedelta(seconds=(step-1) * SENSOR_INTERVAL_SECONDS)
            
            # Update time features
            hour, minute = step_time.hour, step_time.minute
            feat_arr[5] = np.sin(2 * np.pi * hour / 24)
            feat_arr[6] = np.cos(2 * np.pi * hour / 24)
            feat_arr[7] = np.sin(2 * np.pi * minute / 60)
            feat_arr[8] = np.cos(2 * np.pi * minute / 60)
            
            # Predict
            raw_pred = model.predict(feat_arr.reshape(1, -1))[0]
            
            # Clamp and store
            pred_dict = {
                "temperature": float(raw_pred[0]),
                "humidity":    float(raw_pred[1]),
                "airQuality":  float(raw_pred[2]),
                "rainfall":    float(raw_pred[3]),
                "ldr":         float(raw_pred[4])
            }
            clamped = ModelService.clamp_prediction(pred_dict)
            step_predictions[step] = clamped
            
            # Shift for next iteration
            feat_arr[9:14] = feat_arr[0:5] # current becomes lag
            feat_arr[0:5] = [clamped[c] for c in ["temperature", "humidity", "airQuality", "rainfall", "ldr"]]
            
        # Format results (Standardized for frontend)
        results = []
        for h in sorted(horizons_seconds):
            step_idx = max(1, round(h / SENSOR_INTERVAL_SECONDS))
            step_idx = min(step_idx, max_steps)
            pred = step_predictions[step_idx]
            
            # Rounding and mapping
            res_item = {
                "horizon_seconds": h,
                "horizon_label": _label_for_seconds(h),
                "timestamp": (now_utc + timedelta(seconds=h)).isoformat(),
                "temperature": round(pred["temperature"], 2),
                "humidity": round(pred["humidity"], 2),
                "airQuality": round(pred["airQuality"], 2),
                "rainfall": round(pred["rainfall"], 2),
                "ldr": round(pred["ldr"], 2),
                "status": {
                    col: _get_sensor_status(col, pred[col])
                    for col in ["temperature", "humidity", "airQuality", "rainfall", "ldr"]
                },
                "aqi_category": _get_aqi_category(pred["airQuality"]),
                "anomaly": any(
                    _get_sensor_status(col, pred[col]) == "danger"
                    for col in ["temperature", "humidity", "airQuality", "rainfall", "ldr"]
                ),
            }
            results.append(res_item)
            
        return {
            "sensor_interval_seconds": SENSOR_INTERVAL_SECONDS,
            "horizons": results
        }
