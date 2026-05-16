import os
import time
import json
import logging
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd

try:
    from feature_extractor import generate_features
except ImportError:
    from backend.feature_extractor import generate_features

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

MODEL_PATH = Path(__file__).parent / "model.pkl"
model = None

def load_model():
    global model
    try:
        model = joblib.load(MODEL_PATH)
        logger.info("Model loaded successfully")
    except FileNotFoundError:
        logger.warning("model.pkl not found - predictions will fail")

load_model()

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None
    }), 200

@app.route("/predict", methods=["POST"])
def predict():
    start = time.time()
    data = request.get_json()

    if not data or "url" not in data:
        return jsonify({"error": "URL missing"}), 400

    url = data["url"]

    if model is None:
        return jsonify({"error": "Model not loaded"}), 500

    try:
        features = generate_features(url)
        feature_frame = pd.DataFrame([features])
        prediction = model.predict(feature_frame)[0]
        probability = model.predict_proba(feature_frame)[0]
        phishing_chance = round(float(probability[1]) * 100, 1)

        if phishing_chance >= 70:
            status = "Dangerous"
        elif phishing_chance >= 40:
            status = "Suspicious"
        else:
            status = "Safe"

        response_time = round((time.time() - start) * 1000, 1)

        log_entry = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "url_checked": url,
            "status_returned": status,
            "phishing_score": phishing_chance,
            "response_time_ms": response_time
        }
        logger.info(json.dumps(log_entry))

        return jsonify({
            "url": url,
            "status": status,
            "phishing_chance": phishing_chance,
            "prediction": int(prediction),
            "response_time_ms": response_time
        })

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({"error": "Prediction failed", "detail": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
