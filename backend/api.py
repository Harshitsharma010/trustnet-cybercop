from __future__ import annotations

import json
import logging
import os
import time

from flask import Flask, jsonify, request
from flask_cors import CORS

try:
    from detector import DetectionError, ModelUnavailableError, load_model, model_info, model_metrics, predict_url
except ImportError:  # pragma: no cover - package import path
    from .detector import DetectionError, ModelUnavailableError, load_model, model_info, model_metrics, predict_url


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
CORS(app, resources={r"/*": {"origins": allowed_origins}})

load_model()


def _error(message: str, status_code: int):
    return jsonify({"error": message}), status_code


@app.route("/", methods=["GET"])
def index():
    return jsonify(
        {
            "service": "TrustNet CyberCop phishing detection API",
            "status": "running",
            "model": model_info(),
            "endpoints": {
                "health": "/health",
                "predict": "/predict",
                "analyze": "/analyze",
                "model_info": "/model/info",
                "model_metrics": "/model/metrics",
            },
        }
    ), 200


@app.route("/health", methods=["GET"])
def health():
    info = model_info()
    return jsonify(
        {
            "status": "healthy",
            "model_loaded": info["model_loaded"],
            "model_version": info["model_version"],
            "feature_count": info["feature_count"],
            "profile": info["model_profile"],
        }
    ), 200


@app.route("/model/info", methods=["GET"])
def get_model_info():
    return jsonify(model_info()), 200


@app.route("/model/metrics", methods=["GET"])
def get_model_metrics():
    return jsonify(model_metrics()), 200


def _scan_request(default_deep_scan: bool = False):
    data = request.get_json(silent=True)
    if not data or "url" not in data:
        return _error("URL missing", 400)

    deep_scan = bool(data.get("deep_scan", default_deep_scan))
    started = time.time()

    try:
        result = predict_url(str(data["url"]), deep_scan=deep_scan)
    except DetectionError as exc:
        return _error(str(exc), getattr(exc, "status_code", 400))
    except ModelUnavailableError as exc:
        return _error(str(exc), getattr(exc, "status_code", 500))
    except Exception as exc:  # pragma: no cover - defensive API boundary
        logger.exception("Prediction error")
        return jsonify({"error": "Prediction failed", "detail": str(exc)}), 500

    log_entry = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "url_checked": result["url"],
        "status_returned": result["status"],
        "risk_score": result["risk_score"],
        "scan_mode": result["scan_mode"],
        "response_time_ms": round((time.time() - started) * 1000, 1),
    }
    logger.info(json.dumps(log_entry))
    return jsonify(result), 200


@app.route("/predict", methods=["POST"])
def predict():
    return _scan_request(default_deep_scan=False)


@app.route("/analyze", methods=["POST"])
def analyze():
    return _scan_request(default_deep_scan=True)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
