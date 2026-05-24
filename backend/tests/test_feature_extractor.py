from __future__ import annotations

import sys
import unittest
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from feature_extractor import extract_url_intelligence
from model_config import FEATURE_COLUMNS


class FeatureExtractorTests(unittest.TestCase):
    def test_extracts_full_feature_vector(self):
        result = extract_url_intelligence("https://github.com")

        self.assertEqual(set(result["features"].keys()), set(FEATURE_COLUMNS))
        self.assertEqual(len(result["features"]), 47)
        self.assertEqual(result["features"]["uses_https"], 1)
        self.assertLess(result["heuristic_score"], 15)

    def test_flags_brand_impersonation(self):
        result = extract_url_intelligence("https://paypal-security-login.xyz/verify/password")

        self.assertEqual(result["features"]["brand_in_host"], 1)
        self.assertGreaterEqual(result["heuristic_score"], 70)
        self.assertTrue(any(signal["code"] == "brand_impersonation" for signal in result["signals"]))

    def test_flags_ip_host_and_plain_http(self):
        result = extract_url_intelligence("http://192.168.0.10/account/verify")

        self.assertEqual(result["features"]["has_ip"], 1)
        self.assertEqual(result["features"]["uses_http"], 1)
        self.assertTrue(any(signal["code"] == "ip_host" for signal in result["signals"]))


if __name__ == "__main__":
    unittest.main()
