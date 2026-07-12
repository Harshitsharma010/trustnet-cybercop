from __future__ import annotations

import io
import json
import sys
import unittest
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS_DIR))

from smoke_check import SmokeCheckError, build_health_url, check_health


class FakeResponse:
    def __init__(self, status_code: int, payload: object):
        self.status_code = status_code
        self.body = json.dumps(payload).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, traceback):
        return False

    def getcode(self) -> int:
        return self.status_code

    def read(self) -> bytes:
        return self.body


class SmokeCheckTests(unittest.TestCase):
    def test_build_health_url_normalizes_trailing_slash(self):
        self.assertEqual(
            build_health_url("https://api.example.com/"),
            "https://api.example.com/health",
        )

    def test_build_health_url_rejects_relative_url(self):
        with self.assertRaisesRegex(SmokeCheckError, "absolute HTTP or HTTPS"):
            build_health_url("api.example.com")

    def test_check_health_accepts_healthy_loaded_model(self):
        def opener(request, timeout):
            self.assertEqual(request.full_url, "https://api.example.com/health")
            self.assertEqual(timeout, 3)
            return FakeResponse(
                200,
                {
                    "status": "healthy",
                    "model_loaded": True,
                    "model_version": "trustnet-url-intel-v2",
                },
            )

        _, _, payload = check_health("https://api.example.com", timeout=3, opener=opener)

        self.assertEqual(payload["model_version"], "trustnet-url-intel-v2")

    def test_check_health_rejects_unhealthy_payload(self):
        def opener(request, timeout):
            return FakeResponse(200, {"status": "degraded", "model_loaded": True})

        with self.assertRaisesRegex(SmokeCheckError, "status=healthy"):
            check_health("https://api.example.com", opener=opener)

    def test_check_health_rejects_missing_model(self):
        def opener(request, timeout):
            return FakeResponse(200, {"status": "healthy", "model_loaded": False})

        with self.assertRaisesRegex(SmokeCheckError, "model_loaded=true"):
            check_health("https://api.example.com", opener=opener)

    def test_check_health_rejects_invalid_json(self):
        class InvalidJsonResponse(FakeResponse):
            def __init__(self):
                self.status_code = 200
                self.body = io.BytesIO(b"not-json").read()

        def opener(request, timeout):
            return InvalidJsonResponse()

        with self.assertRaisesRegex(SmokeCheckError, "valid JSON"):
            check_health("https://api.example.com", opener=opener)


if __name__ == "__main__":
    unittest.main()
