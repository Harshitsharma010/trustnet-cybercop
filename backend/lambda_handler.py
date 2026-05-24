from __future__ import annotations

import base64
import json
import os
from typing import Any

try:
    from detector import DetectionError, ModelUnavailableError, load_model, model_info, model_metrics, predict_url
except ImportError:  # pragma: no cover - package import path
    from .detector import DetectionError, ModelUnavailableError, load_model, model_info, model_metrics, predict_url


load_model()


def _headers() -> dict[str, str]:
    return {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": os.getenv("ALLOWED_ORIGINS", "*"),
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    }


def _response(status_code: int, payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "statusCode": status_code,
        "headers": _headers(),
        "body": json.dumps(payload),
    }


def _body(event: dict[str, Any]) -> dict[str, Any]:
    raw = event.get("body") or "{}"
    if event.get("isBase64Encoded"):
        raw = base64.b64decode(raw).decode("utf-8")
    parsed = json.loads(raw)
    return parsed if isinstance(parsed, dict) else {}


def lambda_handler(event: dict[str, Any], context) -> dict[str, Any]:
    method = event.get("requestContext", {}).get("http", {}).get("method") or event.get("httpMethod", "GET")
    path = event.get("rawPath") or event.get("path") or "/"

    if method == "OPTIONS":
        return _response(200, {"ok": True})

    if method == "GET" and path == "/":
        return _response(
            200,
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
            },
        )

    if method == "GET" and path == "/health":
        info = model_info()
        return _response(
            200,
            {
                "status": "healthy",
                "model_loaded": info["model_loaded"],
                "model_version": info["model_version"],
                "feature_count": info["feature_count"],
                "profile": info["model_profile"],
            },
        )

    if method == "GET" and path == "/model/info":
        return _response(200, model_info())

    if method == "GET" and path == "/model/metrics":
        return _response(200, model_metrics())

    if method == "POST" and path in {"/predict", "/analyze"}:
        try:
            payload = _body(event)
            if "url" not in payload:
                return _response(400, {"error": "URL missing"})

            deep_scan = bool(payload.get("deep_scan", path == "/analyze"))
            return _response(200, predict_url(str(payload["url"]), deep_scan=deep_scan))
        except DetectionError as exc:
            return _response(getattr(exc, "status_code", 400), {"error": str(exc)})
        except ModelUnavailableError as exc:
            return _response(getattr(exc, "status_code", 500), {"error": str(exc)})
        except json.JSONDecodeError:
            return _response(400, {"error": "Invalid JSON body"})
        except Exception as exc:  # pragma: no cover - Lambda boundary
            return _response(500, {"error": "Prediction failed", "detail": str(exc)})

    return _response(404, {"error": "Not found"})
