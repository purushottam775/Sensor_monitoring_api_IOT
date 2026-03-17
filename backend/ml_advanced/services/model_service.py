import joblib
import os
from config import MODEL_PATH, SENSOR_CLAMP_RANGES

class ModelService:
    def __init__(self):
        self.model = None

    def model_exists(self):
        return os.path.exists(MODEL_PATH)

    def load_model(self):
        if not self.model_exists():
            raise FileNotFoundError("Advanced model not found. Please train it first.")
        self.model = joblib.load(MODEL_PATH)
        return self.model

    def get_model(self):
        if self.model is None:
            return self.load_model()
        return self.model

    @staticmethod
    def clamp_prediction(predicted_dict):
        clamped = {}
        for field, value in predicted_dict.items():
            if field in SENSOR_CLAMP_RANGES:
                lo, hi = SENSOR_CLAMP_RANGES[field]
                clamped[field] = max(lo, min(hi, float(value)))
            else:
                clamped[field] = float(value)
        return clamped
