import os
from dotenv import load_dotenv

# Load .env file from two levels up (backend/.env)
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(dotenv_path)

# MongoDB Configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/sensor_data")
DB_NAME = os.getenv("DB_NAME", "sensor_data")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "sensors")

# Model Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models/xgboost_model.joblib")

# Training settings
MIN_TRAIN_ROWS = 100

# Advanced ML API settings - port 5002
API_PORT = 5002

# Sensor reading interval in seconds
SENSOR_INTERVAL_SECONDS = 10

# Default prediction horizons
DEFAULT_HORIZONS = [30, 60, 120, 300, 600]

# Sensor physical clamp ranges
SENSOR_CLAMP_RANGES = {
    "temperature": (-20.0, 80.0),
    "humidity":    (0.0,   100.0),
    "airQuality":  (0.0,   4095.0),
    "rainfall":    (0.0,   4095.0),
    "ldr":         (0.0,   4095.0),
}
