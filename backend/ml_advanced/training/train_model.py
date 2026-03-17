import os
import sys
import json
from datetime import datetime, timezone
import joblib
import numpy as np
import pandas as pd
from xgboost import XGBRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Add ml_advanced/ to Python path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))   # .../ml_advanced/training
ML_DIR = os.path.dirname(CURRENT_DIR)                      # .../ml_advanced
if ML_DIR not in sys.path:
    sys.path.insert(0, ML_DIR)

from utils.db_connection import fetch_sensor_data
from utils.preprocessing import clean_data, feature_engineering
from config import MODEL_PATH, MIN_TRAIN_ROWS

SENSOR_COLS = ["temperature", "humidity", "airQuality", "rainfall", "ldr"]
# Features include core sensors + Sin/Cos time + Lags
FEATURE_COLS = [
    "temperature", "humidity", "airQuality", "rainfall", "ldr",
    "hour_sin", "hour_cos", "min_sin", "min_cos",
    "temperature_lag1", "humidity_lag1", "airQuality_lag1", "rainfall_lag1", "ldr_lag1"
]
TARGET_COLS = ["temperature", "humidity", "airQuality", "rainfall", "ldr"]

def chronological_split(X, y, test_size=0.2):
    n = len(X)
    split_idx = int(n * (1 - test_size))
    return X.iloc[:split_idx], X.iloc[split_idx:], y.iloc[:split_idx], y.iloc[split_idx:]

def create_next_step_dataset(df):
    """
    X(t) = Features at time t
    y(t) = Core sensors at time t+1
    """
    if df.empty:
        raise ValueError("Dataset is empty")
        
    X = df[FEATURE_COLS].copy()
    
    # Target is the core sensor values from the NEXT row
    y = df[TARGET_COLS].shift(-1)
    
    # Remove last row
    X = X.iloc[:-1].copy()
    y = y.iloc[:-1].copy()
    
    return X, y

def train_model():
    print("Fetching sensor data...")
    df = fetch_sensor_data()
    
    if len(df) < MIN_TRAIN_ROWS:
        raise ValueError(f"Insufficient data: {len(df)} rows found, need {MIN_TRAIN_ROWS}")
        
    print("Cleaning and engineering features...")
    df = clean_data(df)
    df = feature_engineering(df)
    
    X, y = create_next_step_dataset(df)
    X_train, X_test, y_train, y_test = chronological_split(X, y)
    
    print(f"Training XGBoost model on {len(X_train)} rows...")
    
    # Using XGBoost with some robust defaults
    base_model = XGBRegressor(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1
    )
    
    model = MultiOutputRegressor(base_model)
    model.fit(X_train, y_train)
    
    print("Evaluating...")
    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    r2 = r2_score(y_test, preds)
    
    print(f"MAE: {mae:.4f}, RMSE: {rmse:.4f}, R2: {r2:.4f}")
    
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    
    # Save metadata
    meta = {
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "model_type": "MultiOutputRegressor(XGBRegressor)",
        "features": FEATURE_COLS,
        "metrics": {"mae": float(mae), "rmse": float(rmse), "r2": float(r2)}
    }
    with open(MODEL_PATH.replace(".joblib", "_meta.json"), "w") as f:
        json.dump(meta, f, indent=2)
        
    print(f"Model saved to {MODEL_PATH}")

if __name__ == "__main__":
    train_model()
