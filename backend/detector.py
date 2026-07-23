from __future__ import annotations

import json
import logging
import time
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

import joblib

try:
    from feature_extractor import extract_url_intelligence, heuristic_score
    from model_config import FAST_SCAN_TIMEOUT_SECONDS, FEATURE_COLUMNS, MAX_URL_LENGTH, METRICS_PATH, MODEL_PATH, MODEL_PROFILE, MODEL_VERSION, STATUS_THRESHOLDS
except ImportError:  # pragma: no cover - package import path
    from .feature_extractor import extract_url_intelligence, heuristic_score
    from .model_config import FAST_SCAN_TIMEOUT_SECONDS, FEATURE_COLUMNS, MAX_URL_LENGTH, METRICS_PATH, MODEL_PATH, MODEL_PROFILE, MODEL_VERSION, STATUS_THRESHOLDS


logger = logging.getLogger(__name__)

MODEL_BUNDLE: dict[str, Any] | None = None
MODEL = None
MODEL_LOAD_ERROR: str | None = None


class DetectionError(ValueError):
    status_code = 400


class ModelUnavailableError(RuntimeError):
    status_code = 500


def normalize_submitted_url(value: str) -> str:
    url = str(value or "").strip()

    if not url:
        raise DetectionError("URL missing")

    if len(url) > MAX_URL_LENGTH:
        error = DetectionError("URL too long")
        error.status_code = 413
        raise error

    if not url.startswith(("http://", "https://")):
        raise DetectionError("URL must start with http:// or https://")

    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise DetectionError("Enter a valid HTTP or HTTPS URL.")

    return url


def load_model(model_path: Path = MODEL_PATH) -> bool:
    global MODEL_BUNDLE, MODEL, MODEL_LOAD_ERROR

    try:
        loaded = joblib.load(model_path)
        if isinstance(loaded, dict) and "model" in loaded:
            MODEL_BUNDLE = loaded
            MODEL = loaded["model"]
        else:
            MODEL_BUNDLE = {
                "model": loaded,
                "feature_columns": FEATURE_COLUMNS,
                "model_version": "legacy-model",
                "model_profile": "legacy-random-forest",
                "thresholds": STATUS_THRESHOLDS,
                "metrics": {},
            }
            MODEL = loaded

        MODEL_LOAD_ERROR = None
        logger.info("Model loaded successfully from %s", model_path)
        return True
    except FileNotFoundError:
        MODEL_BUNDLE = None
        MODEL = None
        MODEL_LOAD_ERROR = f"{model_path.name} not found"
        logger.warning(MODEL_LOAD_ERROR)
        return False
    except Exception as exc:  # pragma: no cover - defensive startup logging
        MODEL_BUNDLE = None
        MODEL = None
        MODEL_LOAD_ERROR = str(exc)
        logger.exception("Model failed to load")
        return False


def ensure_model_loaded() -> None:
    if MODEL is None:
        raise ModelUnavailableError(MODEL_LOAD_ERROR or "Model not loaded")


def _feature_columns() -> list[str]:
    if MODEL_BUNDLE and isinstance(MODEL_BUNDLE.get("feature_columns"), list):
        return list(MODEL_BUNDLE["feature_columns"])
    return FEATURE_COLUMNS


def _model_score(features: dict[str, int | float]) -> float:
    ensure_model_loaded()
    columns = _feature_columns()
    row = [[features.get(column, 0) for column in columns]]

    if hasattr(MODEL, "predict_proba"):
        probability = float(MODEL.predict_proba(row)[0][1])
    else:
        probability = float(MODEL.predict(row)[0])

    return round(max(0.0, min(100.0, probability * 100)), 1)


def _status_from_score(score: float) -> str:
    if score >= STATUS_THRESHOLDS["danger_min"]:
        return "Dangerous"
    if score > STATUS_THRESHOLDS["safe_max"]:
        return "Suspicious"
    return "Safe"


def _confidence(score: float, model_score: float, heuristic: float) -> str:
    nearest_threshold_gap = min(abs(score - STATUS_THRESHOLDS["safe_max"]), abs(score - STATUS_THRESHOLDS["danger_min"]))
    severe_disagreement = (
        (model_score >= STATUS_THRESHOLDS["danger_min"] and heuristic <= STATUS_THRESHOLDS["safe_max"])
        or (heuristic >= STATUS_THRESHOLDS["danger_min"] and model_score <= STATUS_THRESHOLDS["safe_max"])
    )

    if severe_disagreement or nearest_threshold_gap <= 5:
        return "Low"
    if abs(model_score - heuristic) >= 38 or nearest_threshold_gap <= 12:
        return "Medium"
    return "High"


def _critical_signal_present(signals: list[dict[str, Any]]) -> bool:
    return any(signal.get("severity") == "critical" for signal in signals)


def _domain_integrity_signal_present(signals: list[dict[str, Any]]) -> bool:
    domain_integrity_codes = {
        "brand_near_match",
        "random_domain_label",
        "risky_tld",
        "unrecognized_tld",
    }
    return any(str(signal.get("code")) in domain_integrity_codes for signal in signals)


def _brand_lookalike_signal_present(signals: list[dict[str, Any]]) -> bool:
    return any(str(signal.get("code")) == "brand_lookalike" for signal in signals)


def _lookalike_credential_pattern_present(signals: list[dict[str, Any]]) -> bool:
    signal_codes = {str(signal.get("code")) for signal in signals}
    return bool({"brand_lookalike", "brand_near_match"} & signal_codes) and bool(
        signal_codes & {"credential_keyword", "risky_tld", "unrecognized_tld"}
    )


def _trusted_origin_has_only_routine_signals(signals: list[dict[str, Any]]) -> bool:
    exceptional_codes = {
        "at_symbol",
        "cross_domain_redirect",
        "double_slash",
        "executable_file",
        "https_downgrade",
        "ip_host",
        "private_host",
        "punycode",
        "risky_tld",
        "unrecognized_tld",
        "url_shortener",
    }
    return not any(str(signal.get("code")) in exceptional_codes for signal in signals)


def _has_only_contextual_signals(signals: list[dict[str, Any]]) -> bool:
    """Keep an isolated word such as 'login' from becoming a phishing verdict."""
    contextual_codes = {
        "credential_keyword",
        "brand_near_match",
        "financial_keyword",
        "urgency_keyword",
        "long_url",
        "many_query_params",
    }
    signal_codes = {str(signal.get("code")) for signal in signals}
    return bool(signal_codes) and signal_codes <= contextual_codes


def _has_only_preliminary_unknown_signals(signals: list[dict[str, Any]]) -> bool:
    preliminary_codes = {
        "credential_keyword",
        "financial_keyword",
        "urgency_keyword",
        "long_url",
        "many_query_params",
        "random_domain_label",
    }
    signal_codes = {str(signal.get("code")) for signal in signals}
    return bool(signal_codes) and signal_codes <= preliminary_codes


def _merge_signals(*groups: list[dict[str, Any]]) -> list[dict[str, Any]]:
    merged: dict[str, dict[str, Any]] = {}
    severity_rank = {"info": 0, "low": 1, "medium": 2, "high": 3, "critical": 4}

    for group in groups:
        for signal in group:
            code = str(signal.get("code") or signal.get("label") or len(merged))
            existing = merged.get(code)
            if existing is None or severity_rank.get(str(signal.get("severity", "low")), 0) > severity_rank.get(str(existing.get("severity", "low")), 0):
                merged[code] = signal

    return sorted(merged.values(), key=lambda item: severity_rank.get(str(item.get("severity", "low")), 0), reverse=True)


def _deep_inspect_url(url: str, base_features: dict[str, int | float]) -> dict[str, Any]:
    if base_features.get("localhost_or_private"):
        return {
            "status": "skipped",
            "reason": "Deep scan is skipped for private or local hosts to avoid SSRF risk.",
            "signals": [],
            "final_url": url,
            "score_adjustment": 0,
        }

    headers = {
        "User-Agent": "TrustNet-CyberCop/2.0 lightweight-url-intelligence",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    try:
        request = Request(url, headers=headers, method="HEAD")
        with urlopen(request, timeout=FAST_SCAN_TIMEOUT_SECONDS) as response:
            final_url = response.geturl()
            status_code = getattr(response, "status", None)
    except HTTPError as exc:
        if exc.code not in {403, 405}:
            return {
                "status": "failed",
                "reason": f"Remote server returned HTTP {exc.code}.",
                "signals": [],
                "final_url": url,
                "score_adjustment": 0,
            }

        try:
            request = Request(url, headers=headers, method="GET")
            with urlopen(request, timeout=FAST_SCAN_TIMEOUT_SECONDS) as response:
                final_url = response.geturl()
                status_code = getattr(response, "status", None)
        except Exception as retry_exc:
            return {
                "status": "failed",
                "reason": str(retry_exc),
                "signals": [],
                "final_url": url,
                "score_adjustment": 0,
            }
    except (TimeoutError, URLError, ValueError) as exc:
        return {
            "status": "failed",
            "reason": str(exc),
            "signals": [],
            "final_url": url,
            "score_adjustment": 0,
        }

    original = urlparse(url)
    final = urlparse(final_url)
    signals: list[dict[str, Any]] = []
    adjustment = 0

    if final_url != url and final.hostname != original.hostname:
        signals.append(
            {
                "code": "cross_domain_redirect",
                "label": "Cross-domain redirect",
                "severity": "medium",
                "detail": "The URL redirects to a different host during deep inspection.",
                "evidence": final.hostname,
            }
        )
        adjustment += 12

    if original.scheme == "https" and final.scheme == "http":
        signals.append(
            {
                "code": "https_downgrade",
                "label": "HTTPS downgrade",
                "severity": "high",
                "detail": "The final destination downgrades from HTTPS to HTTP.",
                "evidence": final_url,
            }
        )
        adjustment += 22

    return {
        "status": "completed",
        "http_status": status_code,
        "signals": signals,
        "final_url": final_url,
        "score_adjustment": adjustment,
    }


def predict_url(url: str, deep_scan: bool = False) -> dict[str, Any]:
    started = time.time()
    normalized_url = normalize_submitted_url(url)
    intelligence = extract_url_intelligence(normalized_url)
    features = intelligence["features"]
    base_signals = intelligence["signals"]

    model_score = _model_score(features)
    base_heuristic = float(intelligence["heuristic_score"])

    deep_result = {
        "status": "not_requested",
        "signals": [],
        "final_url": normalized_url,
        "score_adjustment": 0,
    }
    if deep_scan:
        deep_result = _deep_inspect_url(normalized_url, features)

    signals = _merge_signals(base_signals, list(deep_result.get("signals", [])))
    adjusted_heuristic = min(100.0, heuristic_score(features, signals) + float(deep_result.get("score_adjustment", 0)))

    risk_score = round((model_score * 0.68) + (adjusted_heuristic * 0.32), 1)
    if _critical_signal_present(signals):
        risk_score = max(risk_score, 78.0)
    elif _lookalike_credential_pattern_present(signals):
        risk_score = max(risk_score, 78.0)
    elif _domain_integrity_signal_present(signals) or _brand_lookalike_signal_present(signals):
        risk_score = max(risk_score, 45.0)
    if intelligence.get("trusted_brand_domain") and _trusted_origin_has_only_routine_signals(signals):
        risk_score = min(risk_score, 24.0)
    elif not _lookalike_credential_pattern_present(signals) and (
        _has_only_preliminary_unknown_signals(signals) or _has_only_contextual_signals(signals)
    ):
        # Preliminary lexical or domain-shape clues need corroboration before
        # the engine calls an unknown URL dangerous.
        risk_score = min(risk_score, STATUS_THRESHOLDS["danger_min"] - 0.1)
    if not signals and features.get("uses_https"):
        risk_score = min(risk_score, 24.0)

    status = _status_from_score(risk_score)
    prediction = 1 if status == "Dangerous" else 0
    response_time = round((time.time() - started) * 1000, 1)

    return {
        "url": normalized_url,
        "final_url": deep_result.get("final_url", normalized_url),
        "status": status,
        "verdict": status,
        "risk_score": risk_score,
        "phishing_chance": risk_score,
        "prediction": prediction,
        "confidence": _confidence(risk_score, model_score, adjusted_heuristic),
        "model_score": model_score,
        "heuristic_score": round(adjusted_heuristic, 1),
        "scan_mode": "deep" if deep_scan else "fast",
        "deep_scan": deep_result,
        "reasons": signals[:8],
        "features": features,
        "feature_count": len(_feature_columns()),
        "model_version": model_info()["model_version"],
        "model_profile": model_info()["model_profile"],
        "response_time_ms": response_time,
    }


def model_info() -> dict[str, Any]:
    metrics = (MODEL_BUNDLE or {}).get("metrics", {}) if MODEL_BUNDLE else {}
    selected_metrics = metrics.get("selected_metrics", {}) if isinstance(metrics, dict) else {}

    return {
        "model_loaded": MODEL is not None,
        "model_load_error": MODEL_LOAD_ERROR,
        "model_version": (MODEL_BUNDLE or {}).get("model_version", MODEL_VERSION) if MODEL_BUNDLE else MODEL_VERSION,
        "model_profile": (MODEL_BUNDLE or {}).get("model_profile", MODEL_PROFILE) if MODEL_BUNDLE else MODEL_PROFILE,
        "selected_model": metrics.get("selected_model") if isinstance(metrics, dict) else None,
        "trained_at": (MODEL_BUNDLE or {}).get("trained_at") if MODEL_BUNDLE else None,
        "feature_count": len(_feature_columns()),
        "thresholds": (MODEL_BUNDLE or {}).get("thresholds", STATUS_THRESHOLDS) if MODEL_BUNDLE else STATUS_THRESHOLDS,
        "metrics_summary": {
            "accuracy": selected_metrics.get("accuracy"),
            "precision": selected_metrics.get("precision"),
            "recall": selected_metrics.get("recall"),
            "f1": selected_metrics.get("f1"),
            "roc_auc": selected_metrics.get("roc_auc"),
        },
        "aws_free_tier_posture": {
            "training": "local/offline only",
            "inference": "lightweight scikit-learn model artifact",
            "default_scan": "no external fetches",
            "deep_scan": "optional short-timeout redirect check",
            "recommended_hosting": "Amplify static frontend + Lambda container/API Gateway backend",
        },
    }


def model_metrics() -> dict[str, Any]:
    if MODEL_BUNDLE and isinstance(MODEL_BUNDLE.get("metrics"), dict):
        return MODEL_BUNDLE["metrics"]

    if METRICS_PATH.exists():
        return json.loads(METRICS_PATH.read_text(encoding="utf-8"))

    return {
        "model_version": MODEL_VERSION,
        "model_profile": MODEL_PROFILE,
        "selected_metrics": {},
        "top_features": [],
        "notes": ["Metrics are not available. Run python backend/train_model.py to regenerate them."],
    }
