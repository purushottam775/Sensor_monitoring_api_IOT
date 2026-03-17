import os
import sys
import json
from datetime import datetime, timezone

import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.multioutput import MultiOutputRegressor

# Add ml/ to Python path so sibling imports work when running this file directly
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))   # .../ml/training
ML_DIR = os.path.dirname(CURRENT_DIR)                      # .../ml
if ML_DIR not in sys.path:
    sys.path.insert(0, ML_DIR)

from utils.db_connection import fetch_sensor_data
from utils.preprocessing import clean_data
from config import MODEL_PATH, MIN_TRAIN_ROWS

FEATURE_COLS = ["temperature", "humidity", "airQuality", "rainfall", "ldr", "hour", "minute"]
TARGET_COLS = ["temperature", "humidity", "airQuality", "rainfall", "ldr"]


def chronological_split(X, y, test_size=0.2):
    """
    Time-aware split: keeps row order intact.
    Best for sensor data that comes in chronological order.
    """
    n = len(X)
    if n < 5:
        raise ValueError("Not enough rows to split data")

    split_idx = int(n * (1 - test_size))
    split_idx = max(1, min(split_idx, n - 1))

    X_train = X.iloc[:split_idx].copy()
    X_test = X.iloc[split_idx:].copy()
    y_train = y.iloc[:split_idx].copy()
    y_test = y.iloc[split_idx:].copy()

    return X_train, X_test, y_train, y_test


def ensure_model_dir():
    model_dir = os.path.dirname(MODEL_PATH)
    os.makedirs(model_dir, exist_ok=True)


def save_metadata(metadata):
    meta_path = os.path.join(os.path.dirname(MODEL_PATH), "model_meta.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)


def create_next_step_dataset(df):
    """
    Create supervised dataset for next-step prediction.

    X(t) = current sensor values
    y(t) = next row sensor values
    """
    if df is None or df.empty:
        raise ValueError("Dataset is empty")

    missing = [c for c in FEATURE_COLS if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(missing)}")

    # Keep only needed columns
    data = df[FEATURE_COLS].copy()

    # Convert to numeric
    for col in FEATURE_COLS:
        data[col] = data[col].astype(float)

    # X = current row
    X = data.copy()

    # y = next row values
    y = data.shift(-1)

    # Remove last row (no next value)
    X = X.iloc[:-1].copy()
    y = y.iloc[:-1].copy()

    # Final safety
    if X.isnull().any().any() or y.isnull().any().any():
        valid_mask = ~(X.isnull().any(axis=1) | y.isnull().any(axis=1))
        X = X.loc[valid_mask].copy()
        y = y.loc[valid_mask].copy()

    if len(X) < MIN_TRAIN_ROWS:
        raise ValueError(
            f"Not enough valid training rows after next-step preparation. "
            f"Found {len(X)}, need at least {MIN_TRAIN_ROWS}"
        )

    return X, y


def train_model():
    print("Fetching sensor data from MongoDB...")
    df = fetch_sensor_data()

    if df is None or df.empty:
        raise ValueError("No sensor data found for training")

    if len(df) < MIN_TRAIN_ROWS:
        raise ValueError(
            f"Not enough training rows. Found {len(df)}, need at least {MIN_TRAIN_ROWS}"
        )

    print("Cleaning data...")
    df = clean_data(df)

    # Sort by timestamp if available
    if "timestamp" in df.columns:
        df["timestamp"] = np.array(df["timestamp"], dtype="datetime64[ns]")
        df = df.sort_values("timestamp").reset_index(drop=True)
    else:
        df = df.reset_index(drop=True)

    if df is None or df.empty:
        raise ValueError("Dataset became empty after cleaning")

    print("Preparing next-step multi-output dataset...")
    # Add temporal features before shifting for targets
    if "timestamp" in df.columns:
        df["hour"] = df["timestamp"].dt.hour
        df["minute"] = df["timestamp"].dt.minute
    else:
        # Fallback if no timestamp
        df["hour"] = 0
        df["minute"] = 0

    X, y = create_next_step_dataset(df)

    if len(X) == 0 or len(y) == 0:
        raise ValueError("Failed to create training dataset")

    # Ensure target variation exists
    if y.nunique().min() < 2:
        raise ValueError("One or more target columns have only one unique value; model cannot train properly")

    print(f"Training rows available: {len(X)}")
    X_train, X_test, y_train, y_test = chronological_split(X, y, test_size=0.2)

    if len(X_test) == 0 or len(X_train) == 0:
        raise ValueError("Train/test split failed due to insufficient data")

    print("Training MultiOutput RandomForestRegressor...")
    base_model = RandomForestRegressor(
        n_estimators=100,      # Faster iterative predictions
        max_depth=10,         # Better generalization for small datasets
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )

    model = MultiOutputRegressor(base_model)
    model.fit(X_train, y_train)

    print("Evaluating model...")
    predictions = model.predict(X_test)

    mae = mean_absolute_error(y_test, predictions)
    mse = mean_squared_error(y_test, predictions)
    rmse = float(np.sqrt(mse))
    r2 = r2_score(y_test, predictions)

    print("\nModel evaluation:")
    print(f"MAE : {mae:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"R2  : {r2:.4f}")

    ensure_model_dir()
    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to: {MODEL_PATH}")

    metadata = {
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "model_type": "MultiOutputRegressor(RandomForestRegressor)",
        "target": "next_step_all_sensors",
        "features": FEATURE_COLS,
        "targets": TARGET_COLS,
        "prediction_type": "next_time_step",
        "rows_used": int(len(X)),
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "metrics": {
            "mae": float(mae),
            "rmse": float(rmse),
            "r2": float(r2),
        }
    }

    save_metadata(metadata)
    print("Model metadata saved successfully.")


if __name__ == "__main__":
    train_model()