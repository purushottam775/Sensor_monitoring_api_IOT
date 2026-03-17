from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys

# Path setup
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from services.predict_service import AdvancedPredictor
from services.model_service import ModelService
from config import API_PORT

app = Flask(__name__)
CORS(app)

model_service = ModelService()
predictor = AdvancedPredictor()

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "success", 
        "service": "advanced-ml-api",
        "model_loaded": model_service.model is not None
    })

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        # Simplified validation for now
        required = ["temperature", "humidity", "airQuality", "rainfall", "ldr"]
        if not all(k in data for k in required):
            return jsonify({"status": "error", "message": "Missing required fields"}), 400
            
        result = predictor.predict_horizons(data, data.get("horizons_seconds"))
        return jsonify({"status": "success", **result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/train", methods=["POST"])
def train():
    try:
        from training.train_model import train_model
        train_model()
        model_service.load_model()
        return jsonify({"status": "success", "message": "Advanced model trained and loaded"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    print(f"Starting Advanced ML API on port {API_PORT}...")
    app.run(host="0.0.0.0", port=API_PORT, debug=False)
