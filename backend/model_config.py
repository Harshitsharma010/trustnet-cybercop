from __future__ import annotations

from pathlib import Path

MODEL_VERSION = "trustnet-url-intel-v2"
MODEL_PROFILE = "free-tier-lightweight-hybrid"
MODEL_PATH = Path(__file__).with_name("model.pkl")
METRICS_PATH = Path(__file__).with_name("model_metrics.json")

MAX_URL_LENGTH = 2048
FAST_SCAN_TIMEOUT_SECONDS = 2.0

STATUS_THRESHOLDS = {
    "safe_max": 39.9,
    "danger_min": 70.0,
}

FEATURE_COLUMNS = [
    "url_length",
    "hostname_length",
    "path_length",
    "query_length",
    "num_dots",
    "num_hyphens",
    "num_underscores",
    "num_slashes",
    "num_digits",
    "num_percent_encoded",
    "num_query_params",
    "digit_ratio",
    "special_char_ratio",
    "hostname_entropy",
    "path_entropy",
    "has_ip",
    "uses_https",
    "uses_http",
    "has_at",
    "has_double_slash",
    "has_port",
    "has_punycode",
    "has_shortener",
    "has_https_token",
    "has_prefix_suffix",
    "num_subdomains",
    "subdomain_depth",
    "suspicious_tld",
    "brand_in_host",
    "brand_in_path",
    "keyword_count",
    "credential_keyword_count",
    "financial_keyword_count",
    "urgency_keyword_count",
    "long_url",
    "very_long_url",
    "long_hostname",
    "long_path",
    "many_subdomains",
    "many_dots",
    "many_hyphens",
    "many_digits",
    "many_query_params",
    "contains_encoded_chars",
    "executable_file",
    "free_hosting_domain",
    "localhost_or_private",
]
