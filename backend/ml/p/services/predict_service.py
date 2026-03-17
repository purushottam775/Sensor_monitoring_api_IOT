"""
predict_service.py
==================
Multi-horizon iterative rollout prediction service.

The RandomForest model predicts the *next* sensor reading (t+1) given the
current reading (t).  We chain those predictions to reach arbitrary horizons:

    t → t+1 → t+2 → … → t+N

Because each step's prediction becomes the next step's input, longer horizons
accumulate drift.  We apply two mitigations:
  1. Physical clamping — values stay within realistic sensor bounds.
  2. Exponential smoothing — blends the prediction toward the anchor (current)
     reading so the forecast decays gently instead of running away.
"""

from datetime import datetime, timedelta, timezone
import math
import time
import pandas as pd

from services.model_service import ModelService
from services.validation_service import ValidationService
from config import SENSOR_INTERVAL_SECONDS, DEFAULT_HORIZONS


# ── Constants ──────────────────────────────────────────────────────────────────
FEATURE_COLS = ["temperature", "humidity", "airQuality", "rainfall", "ldr", "hour", "minute"]

# Smoothing factor:  0 = no smoothing, 1 = always use anchor.
# 0.15 means "gently pull each predicted step 15% back toward the anchor".
SMOOTHING_ALPHA = 0.15

# DEBUG: Print performance stats
DEBUG_PERF = True

# AQI classification thresholds (based on raw ADC / typical 0-4095 scale)
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
    """Return SAFE/WARNING/DANGER status for a sensor value."""
    ranges = STATUS_THRESHOLDS.get(field, [])
    for lo, hi, status in ranges:
        if lo <= value <= hi:
            return status
    return "unknown"


def _get_aqi_category(air_quality_raw):
    """Map raw airQuality ADC value to a human-readable AQI category."""
    for threshold, label, _ in AQI_CATEGORIES:
        if air_quality_raw <= threshold:
            return label
    return "Hazardous"


def _label_for_seconds(seconds):
    """Human-readable label for a horizon in seconds."""
    if seconds < 60:
        return f"+{seconds}s"
    elif seconds < 3600:
        mins = seconds // 60
        secs = seconds % 60
        return f"+{mins}min" + (f" {secs}s" if secs else "")
    else:
        hours = seconds // 3600
        return f"+{hours}hr"


def _smooth(current_val, predicted_val, alpha=SMOOTHING_ALPHA, step=1):
    """
    Exponential smoothing with step-dependent decay.
    As step count increases, the smoothing pulls slightly harder toward current.
    """
    # Increase alpha gently with step number so far-future forecasts regress more
    effective_alpha = min(0.5, alpha * (1 + step * 0.05))
    return predicted_val * (1 - effective_alpha) + current_val * effective_alpha


class SensorPredictor:

    def __init__(self):
        self.model_service = ModelService()

    def _run_single_step(self, sensor_dict, model):
        """Feed a sensor dict into the model, return the next-step dict."""
        # Fix: Use DataFrame to avoid scikit-learn feature names warning
        features = pd.DataFrame([sensor_dict])[FEATURE_COLS]
        raw = model.predict(features)

        if raw is None or len(raw) == 0:
            raise RuntimeError("Model returned empty prediction")

        p = raw[0]
        predicted = {col: float(p[i]) for i, col in enumerate(FEATURE_COLS)}

        # Clamp to physical ranges immediately
        return ModelService.clamp_prediction(predicted)

    def predict(self, data):
        """
        Single next-step prediction (backward-compatible).
        Returns a flat dict of predicted sensor values.
        """
        cleaned = ValidationService.validate_prediction_input(data)
        model = self.model_service.get_model()
        result = self._run_single_step(cleaned, model)
        return result

    def predict_horizons(self, data,
                         horizons_seconds=None,
                         interval_seconds=None):
        """Multi-horizon iterative rollout prediction."""
        start_time = time.perf_counter()
        
        cleaned = ValidationService.validate_prediction_input(data)

        if horizons_seconds is None:
            horizons_seconds = list(DEFAULT_HORIZONS)

        if interval_seconds is None:
            interval_seconds = SENSOR_INTERVAL_SECONDS

        if interval_seconds <= 0:
            raise ValueError("interval_seconds must be positive")

        # Maximum steps needed
        max_horizon = max(horizons_seconds)
        max_steps = math.ceil(max_horizon / interval_seconds)

        # Get model once
        model = self.model_service.get_model()
        now_utc = datetime.now(timezone.utc)
        anchor = dict(cleaned)

        # Iterative rollout
        current = dict(cleaned)
        # Seed initial hour/minute
        current["hour"] = now_utc.hour
        current["minute"] = now_utc.minute
        
        step_predictions = {}

        for step in range(1, max_steps + 1):
            predicted = self._run_single_step(current, model)

            # Update hour/minute for the next step's input based on interval
            step_time = now_utc + timedelta(seconds=step * interval_seconds)
            predicted["hour"] = step_time.hour
            predicted["minute"] = step_time.minute

            smoothed = {}
            for col in FEATURE_COLS:
                # hour/minute are deterministic, no need to smooth them
                if col in ["hour", "minute"]:
                    smoothed[col] = predicted[col]
                else:
                    smoothed[col] = _smooth(anchor[col], predicted[col],
                                            alpha=SMOOTHING_ALPHA, step=step)

            smoothed = ModelService.clamp_prediction(smoothed)
            step_predictions[step] = smoothed
            current = smoothed

        # Build results
        now_utc = datetime.now(timezone.utc)
        horizon_results = []

        for h_seconds in sorted(horizons_seconds):
            steps_needed = max(1, round(h_seconds / interval_seconds))
            steps_needed = min(steps_needed, max_steps)

            pred = step_predictions[steps_needed]
            timestamp = now_utc + timedelta(seconds=h_seconds)

            horizon_results.append({
                "horizon_seconds": h_seconds,
                "horizon_label": _label_for_seconds(h_seconds),
                "timestamp": timestamp.isoformat(),
                "temperature": round(pred["temperature"], 2),
                "humidity": round(pred["humidity"], 2),
                "airQuality": round(pred["airQuality"], 2),
                "rainfall": round(pred["rainfall"], 2),
                "ldr": round(pred["ldr"], 2),
                "status": {
                    col: _get_sensor_status(col, pred[col])
                    for col in FEATURE_COLS
                },
                "aqi_category": _get_aqi_category(pred["airQuality"]),
                "anomaly": any(
                    _get_sensor_status(col, pred[col]) == "danger"
                    for col in FEATURE_COLS
                ),
            })

        total_time = time.perf_counter() - start_time
        if DEBUG_PERF:
            print(f"[ML] Multi-horizon prediction ({max_steps} steps) took {total_time:.4f}s")

        return {
            "sensor_interval_seconds": interval_seconds,
            "horizons": horizon_results,
        }