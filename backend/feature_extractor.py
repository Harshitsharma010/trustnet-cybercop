from __future__ import annotations

import ipaddress
import math
import re
from dataclasses import asdict, dataclass
from typing import Any
from urllib.parse import parse_qsl, unquote, urlparse

try:
    from model_config import FEATURE_COLUMNS
except ImportError:  # pragma: no cover - package import path
    from .model_config import FEATURE_COLUMNS


SHORTENER_DOMAINS = {
    "bit.ly",
    "cutt.ly",
    "goo.gl",
    "is.gd",
    "lnkd.in",
    "ow.ly",
    "rebrand.ly",
    "shorte.st",
    "t.co",
    "tiny.cc",
    "tinyurl.com",
    "trib.al",
}

RISKY_TLDS = {
    "buzz",
    "click",
    "country",
    "download",
    "fit",
    "gq",
    "info",
    "kim",
    "link",
    "loan",
    "men",
    "ml",
    "mom",
    "party",
    "review",
    "ru",
    "shop",
    "stream",
    "support",
    "tk",
    "top",
    "work",
    "xyz",
    "zip",
}

COMMON_TLDS = {
    "agency",
    "app",
    "ai",
    "biz",
    "cloud",
    "co",
    "com",
    "dev",
    "digital",
    "edu",
    "gov",
    "in",
    "io",
    "life",
    "me",
    "media",
    "net",
    "news",
    "online",
    "org",
    "page",
    "pro",
    "sbi",
    "site",
    "solutions",
    "space",
    "store",
    "systems",
    "tech",
    "today",
    "us",
    "website",
    "world",
}

SECOND_LEVEL_SUFFIXES = {
    "ac.in",
    "co.in",
    "co.uk",
    "com.au",
    "com.br",
    "com.cn",
    "com.sg",
    "net.in",
    "org.in",
}

SUSPICIOUS_KEYWORDS = {
    "account",
    "alert",
    "billing",
    "confirm",
    "customer",
    "limited",
    "login",
    "password",
    "recover",
    "secure",
    "signin",
    "support",
    "suspend",
    "unlock",
    "update",
    "verify",
    "wallet",
}

CREDENTIAL_KEYWORDS = {
    "credential",
    "login",
    "otp",
    "passcode",
    "password",
    "signin",
    "twofactor",
    "verify",
}

FINANCIAL_KEYWORDS = {
    "bank",
    "billing",
    "card",
    "invoice",
    "payment",
    "refund",
    "upi",
    "wallet",
}

URGENCY_KEYWORDS = {
    "24h",
    "blocked",
    "expire",
    "immediate",
    "limited",
    "locked",
    "now",
    "suspend",
    "urgent",
}

BRAND_DOMAINS = {
    "amazon": {"amazon.com", "amazon.in"},
    "apple": {"apple.com"},
    "axis": {"axisbank.com"},
    "facebook": {"facebook.com", "fb.com"},
    "github": {"github.com"},
    "google": {"google.com"},
    "hdfc": {"hdfcbank.com"},
    "icici": {"icicibank.com"},
    "instagram": {"instagram.com"},
    "microsoft": {"microsoft.com", "office.com", "live.com", "outlook.com"},
    "netflix": {"netflix.com"},
    "openai": {"openai.com"},
    "paypal": {"paypal.com"},
    "paytm": {"paytm.com"},
    "phonepe": {"phonepe.com"},
    "sbi": {"sbi.co.in", "onlinesbi.sbi"},
    "whatsapp": {"whatsapp.com"},
    "zerodha": {"zerodha.com"},
}

FREE_HOSTING_DOMAINS = {
    "000webhostapp.com",
    "blogspot.com",
    "firebaseapp.com",
    "github.io",
    "glitch.me",
    "netlify.app",
    "pages.dev",
    "repl.co",
    "vercel.app",
    "weebly.com",
    "wixsite.com",
}

EXECUTABLE_EXTENSIONS = {
    ".apk",
    ".bat",
    ".cmd",
    ".com",
    ".exe",
    ".jar",
    ".js",
    ".msi",
    ".scr",
    ".vbs",
}

SEVERITY_RANK = {
    "info": 0,
    "low": 1,
    "medium": 2,
    "high": 3,
    "critical": 4,
}

SEVERITY_POINTS = {
    "info": 0,
    "low": 8,
    "medium": 15,
    "high": 26,
    "critical": 38,
}


@dataclass(frozen=True)
class RiskSignal:
    code: str
    label: str
    severity: str
    detail: str
    evidence: str | int | float | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _normalize_url(url: str) -> str:
    value = str(url or "").strip()
    if not re.match(r"^[a-zA-Z][a-zA-Z\d+\-.]*://", value):
        value = f"https://{value}"
    return value


def _safe_hostname(parsed) -> str:
    return (parsed.hostname or "").strip(".").lower()


def _registered_domain(hostname: str) -> str:
    parts = [part for part in hostname.split(".") if part]
    if len(parts) <= 2:
        return hostname

    suffix = ".".join(parts[-2:])
    if suffix in SECOND_LEVEL_SUFFIXES and len(parts) >= 3:
        return ".".join(parts[-3:])

    return suffix


def _subdomain_depth(hostname: str) -> int:
    registered = _registered_domain(hostname)
    if not registered or hostname == registered:
        return 0
    prefix = hostname[: -(len(registered) + 1)]
    return len([part for part in prefix.split(".") if part])


def _tld(hostname: str) -> str:
    parts = [part for part in hostname.split(".") if part]
    return parts[-1] if parts else ""


def _has_unrecognized_tld(hostname: str) -> bool:
    tld = _tld(hostname)
    return len(tld) > 2 and tld not in COMMON_TLDS and tld not in RISKY_TLDS


def _is_ip_hostname(hostname: str) -> bool:
    try:
        ipaddress.ip_address(hostname.strip("[]"))
        return True
    except ValueError:
        return False


def _is_local_or_private(hostname: str) -> bool:
    if hostname in {"localhost", "local"} or hostname.endswith(".local"):
        return True

    try:
        ip = ipaddress.ip_address(hostname.strip("[]"))
        return ip.is_private or ip.is_loopback or ip.is_link_local
    except ValueError:
        return False


def _shannon_entropy(value: str) -> float:
    if not value:
        return 0.0

    frequencies = {}
    for char in value:
        frequencies[char] = frequencies.get(char, 0) + 1

    length = len(value)
    entropy = -sum((count / length) * math.log2(count / length) for count in frequencies.values())
    return round(entropy, 4)


def _ratio(count: int, total: int) -> float:
    return round(count / total, 4) if total else 0.0


def _count_keywords(value: str, keywords: set[str]) -> int:
    compact = value.lower().replace("-", "").replace("_", "")
    return sum(1 for keyword in keywords if keyword in compact)


def _brand_impersonation(hostname: str, url_text: str) -> tuple[int, int, list[str]]:
    registered = _registered_domain(hostname)
    compact_host = hostname.replace("-", "").replace(".", "")
    compact_url = url_text.lower().replace("-", "").replace("_", "")
    host_hit = 0
    path_hit = 0
    matched: list[str] = []

    for brand, trusted_domains in BRAND_DOMAINS.items():
        if brand in compact_host and registered not in trusted_domains and hostname not in trusted_domains:
            host_hit = 1
            matched.append(brand)
        elif brand in compact_url and registered not in trusted_domains and hostname not in trusted_domains:
            path_hit = 1
            matched.append(brand)

    return host_hit, path_hit, sorted(set(matched))


def _has_shortener(hostname: str) -> bool:
    registered = _registered_domain(hostname)
    return registered in SHORTENER_DOMAINS or hostname in SHORTENER_DOMAINS


def _uses_free_hosting(hostname: str) -> bool:
    registered = _registered_domain(hostname)
    return registered in FREE_HOSTING_DOMAINS or any(hostname.endswith(f".{domain}") for domain in FREE_HOSTING_DOMAINS)


def _has_executable_path(path: str) -> bool:
    lowered = unquote(path).lower()
    return any(lowered.endswith(extension) or f"{extension}?" in lowered for extension in EXECUTABLE_EXTENSIONS)


def _has_explicit_port(parsed) -> bool:
    try:
        return parsed.port is not None
    except ValueError:
        return True


def _add_signal(signals: list[RiskSignal], code: str, label: str, severity: str, detail: str, evidence=None) -> None:
    signals.append(RiskSignal(code=code, label=label, severity=severity, detail=detail, evidence=evidence))


def _build_signals(features: dict[str, int | float], parsed, hostname: str, matched_brands: list[str]) -> list[RiskSignal]:
    signals: list[RiskSignal] = []

    if features["has_ip"]:
        _add_signal(signals, "ip_host", "IP address host", "critical", "The URL uses a raw IP address instead of a normal domain.", hostname)
    if features["localhost_or_private"]:
        _add_signal(signals, "private_host", "Private or local host", "medium", "The host points to a local or private network address.", hostname)
    if features["uses_http"]:
        _add_signal(signals, "plain_http", "Plain HTTP", "medium", "The URL does not use HTTPS encryption.", parsed.scheme)
    if features["has_at"]:
        _add_signal(signals, "at_symbol", "At-symbol redirect trick", "high", "The URL contains @, which can hide the real destination.", "@")
    if features["has_double_slash"]:
        _add_signal(signals, "double_slash", "Extra double slash", "medium", "The path contains an extra // sequence often used in redirect tricks.", "//")
    if features["has_shortener"]:
        _add_signal(signals, "url_shortener", "URL shortener", "medium", "Shortened URLs obscure the final destination.", _registered_domain(hostname))
    if features["has_https_token"]:
        _add_signal(signals, "https_token", "Fake HTTPS token", "high", "The domain text includes https to look safer than it is.", hostname)
    if features["has_punycode"]:
        _add_signal(signals, "punycode", "Punycode domain", "high", "Punycode can be used for lookalike domain attacks.", hostname)
    if features["has_port"]:
        try:
            port = parsed.port
        except ValueError:
            port = "invalid"
        _add_signal(signals, "custom_port", "Custom port", "low", "The URL uses an explicit non-standard port.", port)
    if features["suspicious_tld"]:
        _add_signal(signals, "risky_tld", "Risky top-level domain", "medium", "This TLD is commonly seen in low-cost phishing campaigns.", _tld(hostname))
    elif _has_unrecognized_tld(hostname):
        _add_signal(
            signals,
            "unrecognized_tld",
            "Unrecognized top-level domain",
            "medium",
            "The domain suffix is uncommon or typo-like, which can indicate disposable phishing infrastructure.",
            _tld(hostname),
        )
    if features["brand_in_host"]:
        _add_signal(signals, "brand_impersonation", "Possible brand impersonation", "critical", "A known brand appears on an untrusted domain.", ", ".join(matched_brands))
    elif features["brand_in_path"]:
        _add_signal(signals, "brand_keyword_path", "Brand keyword in path", "medium", "A known brand appears away from its trusted domain.", ", ".join(matched_brands))
    if features["credential_keyword_count"]:
        _add_signal(signals, "credential_keyword", "Credential keyword", "high", "The URL contains sign-in or verification language.", features["credential_keyword_count"])
    if features["financial_keyword_count"]:
        _add_signal(signals, "financial_keyword", "Financial keyword", "medium", "The URL contains payment or banking language.", features["financial_keyword_count"])
    if features["urgency_keyword_count"]:
        _add_signal(signals, "urgency_keyword", "Urgency keyword", "medium", "The URL uses urgency language often seen in phishing.", features["urgency_keyword_count"])
    if features["very_long_url"]:
        _add_signal(signals, "very_long_url", "Very long URL", "medium", "The URL is long enough to hide the true destination.", features["url_length"])
    elif features["long_url"]:
        _add_signal(signals, "long_url", "Long URL", "low", "The URL is longer than normal.", features["url_length"])
    if features["many_subdomains"]:
        _add_signal(signals, "many_subdomains", "Many subdomains", "medium", "The hostname has multiple nested subdomains.", features["subdomain_depth"])
    if features["many_hyphens"]:
        _add_signal(signals, "many_hyphens", "Many hyphens", "low", "Hyphen-heavy domains are common in impersonation attempts.", features["num_hyphens"])
    if features["many_digits"]:
        _add_signal(signals, "many_digits", "Digit-heavy URL", "low", "The URL contains an unusual number of digits.", features["num_digits"])
    if features["many_query_params"]:
        _add_signal(signals, "many_query_params", "Many query parameters", "low", "The URL contains many tracking or state parameters.", features["num_query_params"])
    if features["contains_encoded_chars"]:
        _add_signal(signals, "encoded_chars", "Encoded characters", "medium", "Encoded characters can be used to hide suspicious text.", features["num_percent_encoded"])
    if features["executable_file"]:
        _add_signal(signals, "executable_file", "Executable file path", "critical", "The URL points to a potentially executable download.", parsed.path)
    if features["free_hosting_domain"]:
        _add_signal(signals, "free_hosting", "Free hosting domain", "medium", "Free hosting domains are frequently abused for throwaway phishing pages.", _registered_domain(hostname))

    return sorted(signals, key=lambda item: SEVERITY_RANK.get(item.severity, 0), reverse=True)


def heuristic_score(features: dict[str, int | float], signals: list[RiskSignal | dict[str, Any]]) -> float:
    signal_score = 0
    seen_codes = set()

    for signal in signals:
        if isinstance(signal, RiskSignal):
            code = signal.code
            severity = signal.severity
        else:
            code = str(signal.get("code", ""))
            severity = str(signal.get("severity", "low"))

        if code in seen_codes:
            continue

        seen_codes.add(code)
        signal_score += SEVERITY_POINTS.get(severity, 8)

    shape_score = 0
    shape_score += min(10, float(features.get("digit_ratio", 0)) * 40)
    shape_score += min(10, float(features.get("special_char_ratio", 0)) * 45)
    shape_score += min(8, max(0, float(features.get("hostname_entropy", 0)) - 3.6) * 7)

    score = signal_score + shape_score

    if features.get("uses_https") and score < 30:
        score -= 6

    if not signals and features.get("uses_https"):
        score = min(score, 8)

    return round(max(0, min(100, score)), 1)


def generate_features(url: str) -> dict[str, int | float]:
    return extract_url_intelligence(url)["features"]


def extract_url_intelligence(url: str) -> dict[str, Any]:
    normalized_url = _normalize_url(url)
    parsed = urlparse(normalized_url)
    hostname = _safe_hostname(parsed)
    registered = _registered_domain(hostname)
    path = parsed.path or ""
    query = parsed.query or ""
    decoded_url = unquote(normalized_url.lower())
    url_lower = normalized_url.lower()
    netloc = parsed.netloc.lower()

    digit_count = sum(char.isdigit() for char in normalized_url)
    special_count = sum(not char.isalnum() for char in normalized_url)
    query_params = parse_qsl(query, keep_blank_values=True)
    subdomain_depth = _subdomain_depth(hostname)
    brand_in_host, brand_in_path, matched_brands = _brand_impersonation(hostname, decoded_url)

    features: dict[str, int | float] = {
        "url_length": len(normalized_url),
        "hostname_length": len(hostname),
        "path_length": len(path),
        "query_length": len(query),
        "num_dots": normalized_url.count("."),
        "num_hyphens": normalized_url.count("-"),
        "num_underscores": normalized_url.count("_"),
        "num_slashes": normalized_url.count("/"),
        "num_digits": digit_count,
        "num_percent_encoded": normalized_url.count("%"),
        "num_query_params": len(query_params),
        "digit_ratio": _ratio(digit_count, len(normalized_url)),
        "special_char_ratio": _ratio(special_count, len(normalized_url)),
        "hostname_entropy": _shannon_entropy(hostname),
        "path_entropy": _shannon_entropy(path),
        "has_ip": int(_is_ip_hostname(hostname)),
        "uses_https": int(parsed.scheme == "https"),
        "uses_http": int(parsed.scheme == "http"),
        "has_at": int("@" in parsed.netloc or "@" in path or "@" in query),
        "has_double_slash": int("//" in normalized_url[normalized_url.find("//") + 2 :]),
        "has_port": int(_has_explicit_port(parsed)),
        "has_punycode": int("xn--" in hostname),
        "has_shortener": int(_has_shortener(hostname)),
        "has_https_token": int("https" in netloc.replace("https://", "")),
        "has_prefix_suffix": int("-" in registered),
        "num_subdomains": subdomain_depth,
        "subdomain_depth": subdomain_depth,
        "suspicious_tld": int(_tld(hostname) in RISKY_TLDS),
        "brand_in_host": brand_in_host,
        "brand_in_path": brand_in_path,
        "keyword_count": _count_keywords(decoded_url, SUSPICIOUS_KEYWORDS),
        "credential_keyword_count": _count_keywords(decoded_url, CREDENTIAL_KEYWORDS),
        "financial_keyword_count": _count_keywords(decoded_url, FINANCIAL_KEYWORDS),
        "urgency_keyword_count": _count_keywords(decoded_url, URGENCY_KEYWORDS),
        "long_url": int(len(normalized_url) >= 75),
        "very_long_url": int(len(normalized_url) >= 120),
        "long_hostname": int(len(hostname) >= 35),
        "long_path": int(len(path) >= 45),
        "many_subdomains": int(subdomain_depth >= 3),
        "many_dots": int(normalized_url.count(".") >= 5),
        "many_hyphens": int(normalized_url.count("-") >= 3),
        "many_digits": int(digit_count >= 8),
        "many_query_params": int(len(query_params) >= 4),
        "contains_encoded_chars": int("%" in normalized_url),
        "executable_file": int(_has_executable_path(path)),
        "free_hosting_domain": int(_uses_free_hosting(hostname)),
        "localhost_or_private": int(_is_local_or_private(hostname)),
    }

    ordered_features = {column: features.get(column, 0) for column in FEATURE_COLUMNS}
    signals = _build_signals(ordered_features, parsed, hostname, matched_brands)
    score = heuristic_score(ordered_features, signals)

    return {
        "url": normalized_url,
        "hostname": hostname,
        "registered_domain": registered,
        "features": ordered_features,
        "signals": [signal.to_dict() for signal in signals],
        "heuristic_score": score,
    }
