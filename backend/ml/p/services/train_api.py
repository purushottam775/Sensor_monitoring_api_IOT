"""
train_api.py  —  Standalone Training API (optional)
====================================================
This is a lightweight alternative to using the /train endpoint in app.py.
Runs on port 5002 when invoked directly so it does not clash with the
prediction API on port 5001 or Node.js on port 5000.

Usage:  python services/train_api.py
"""

import os
import sys

from flask import Flask, jsonify
from datetime import datetime

# Path setup so sibling imports resolve correctly
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from config import API_PORT
from training.train_model import train_model

app = Flask(__name__)

TRAIN_API_PORT = API_PORT + 1   # 5002


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "ml-training-api",
        "port": TRAIN_API_PORT,
    }), 200


@app.route("/train", methods=["POST"])
def train():
    try:
        train_model()
        return jsonify({
            "status": "success",
            "message": "Model trained successfully",
            "trained_at": datetime.utcnow().isoformat(),
        }), 200

    except ValueError as e:
        return jsonify({"status": "error", "type": "validation_error", "message": str(e)}), 400

    except FileNotFoundError as e:
        return jsonify({"status": "error", "type": "file_error", "message": str(e)}), 404

    except Exception as e:
        return jsonify({
            "status": "error",
            "type": "training_error",
            "message": f"Training failed: {str(e)}",
        }), 500


if __name__ == "__main__":
    print(f"[ML] Starting standalone training API on port {TRAIN_API_PORT} ...")
    app.run(host="0.0.0.0", port=TRAIN_API_PORT, debug=True)