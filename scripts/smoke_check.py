#!/usr/bin/env python3
"""Verify that a deployed TrustNet API is healthy and has loaded its model."""

from __future__ import annotations

import argparse
import json
import sys
import time
from typing import Any, Callable
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen


class SmokeCheckError(RuntimeError):
    """Raised when the deployed API does not satisfy the health contract."""


def build_health_url(base_url: str) -> str:
    normalized = base_url.strip().rstrip("/")
    parsed = urlparse(normalized)

    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise SmokeCheckError("API base URL must be an absolute HTTP or HTTPS URL")

    return f"{normalized}/health"


def check_health(
    base_url: str,
    timeout: float = 10.0,
    opener: Callable[..., Any] = urlopen,
) -> tuple[str, float, dict[str, Any]]:
    health_url = build_health_url(base_url)
    request = Request(health_url, headers={"User-Agent": "trustnet-smoke-check/1.0"})
    started = time.perf_counter()

    try:
        with opener(request, timeout=timeout) as response:
            status_code = response.getcode()
            raw_body = response.read()
    except HTTPError as exc:
        raise SmokeCheckError(f"health endpoint returned HTTP {exc.code}") from exc
    except (URLError, TimeoutError) as exc:
        raise SmokeCheckError(f"health endpoint could not be reached: {exc}") from exc

    elapsed_ms = (time.perf_counter() - started) * 1000

    if status_code != 200:
        raise SmokeCheckError(f"health endpoint returned HTTP {status_code}")

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise SmokeCheckError("health endpoint did not return valid JSON") from exc

    if payload.get("status") != "healthy":
        raise SmokeCheckError("health payload did not report status=healthy")

    if payload.get("model_loaded") is not True:
        raise SmokeCheckError("health payload did not confirm model_loaded=true")

    return health_url, elapsed_ms, payload


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("api_base_url", help="Deployed API base URL")
    parser.add_argument("--timeout", type=float, default=10.0, help="Request timeout in seconds")
    args = parser.parse_args()

    try:
        health_url, elapsed_ms, payload = check_health(args.api_base_url, args.timeout)
    except SmokeCheckError as exc:
        print(f"SMOKE CHECK FAILED: {exc}", file=sys.stderr)
        return 1

    print(
        "SMOKE CHECK PASSED: "
        f"{health_url} responded in {elapsed_ms:.0f} ms "
        f"with model {payload.get('model_version', 'unknown')}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
