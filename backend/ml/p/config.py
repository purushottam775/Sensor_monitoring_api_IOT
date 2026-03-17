import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# MongoDB Configuration
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")
COLLECTION_NAME = os.getenv("COLLECTION_NAME")

# Model Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    os.getenv("ML_MODEL_PATH", "models/model.pkl")
)

# Training settings
MIN_TRAIN_ROWS = int(os.getenv("ML_MIN_TRAIN_ROWS", 100))

# ML API settings — default 5001 to avoid conflict with Node.js (5000)
API_PORT = int(os.getenv("ML_API_PORT", 5001))

# Sensor reading interval in seconds (ESP32 sends data every ~10s)
SENSOR_INTERVAL_SECONDS = int(os.getenv("SENSOR_INTERVAL_SECONDS", 10))

# Default prediction horizons in seconds
DEFAULT_HORIZONS = [30, 60, 120, 300, 600]

# Sensor physical clamp ranges — keep predictions realistic
SENSOR_CLAMP_RANGES = {
    "temperature": (-20.0, 80.0),
    "humidity":    (0.0,   100.0),
    "airQuality":  (0.0,   4095.0),
    "rainfall":    (0.0,   4095.0),
    "ldr":         (0.0,   4095.0),
}


# Validation check
def validate_config():

    if not MONGO_URI:
        raise ValueError("MONGO_URI not set in .env")

    if not DB_NAME:
        raise ValueError("DB_NAME not set in .env")

    if not COLLECTION_NAME:
        raise ValueError("COLLECTION_NAME not set in .env")