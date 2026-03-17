import os
import joblib
from config import MODEL_PATH, SENSOR_CLAMP_RANGES


class ModelService:

    def __init__(self):
        self.model = None

    def model_exists(self):
        return os.path.exists(MODEL_PATH)

    def load_model(self):
        """Load model from disk into memory."""
        if not self.model_exists():
            raise FileNotFoundError(
                f"Trained model not found at: {MODEL_PATH}. "
                "Please train the model first by calling POST /train."
            )

        try:
            self.model = joblib.load(MODEL_PATH)
            # Optimization for Windows: Disable parallel jobs for prediction
            # Iterative rollout calls .predict 60+ times; spawning processes each time is extremely slow.
            if hasattr(self.model, "n_jobs"):
                self.model.n_jobs = 1
            if hasattr(self.model, "estimators_"):
                for est in self.model.estimators_:
                    if hasattr(est, "n_jobs"):
                        est.n_jobs = 1

        except Exception as e:
            raise RuntimeError(f"Failed to load model: {str(e)}")

        return self.model

    def get_model(self):
        """Return cached model, loading from disk only once."""
        if self.model is None:
            return self.load_model()
        return self.model

    def reload_model(self):
        """Force reload — use after retraining."""
        self.model = None
        return self.load_model()

    @staticmethod
    def clamp_prediction(predicted_dict):
        """
        Clamp all predicted sensor values to their physical realistic ranges.
        Prevents runaway drift during iterative multi-step rollout.
        """
        clamped = {}
        for field, value in predicted_dict.items():
            if field in SENSOR_CLAMP_RANGES:
                lo, hi = SENSOR_CLAMP_RANGES[field]
                clamped[field] = max(lo, min(hi, float(value)))
            else:
                clamped[field] = float(value)
        return clamped