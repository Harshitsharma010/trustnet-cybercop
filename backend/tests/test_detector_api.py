from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

import api
from detector import load_model, model_info, predict_url
from lambda_handler import lambda_handler


class DetectorApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        load_model()

    def test_predict_safe_url(self):
        result = predict_url("https://github.com")

        self.assertEqual(result["status"], "Safe")
        self.assertLess(result["risk_score"], 40)
        self.assertEqual(result["feature_count"], 47)

    def test_predict_dangerous_url(self):
        result = predict_url("http://secure-login.verify-account.com/update/password")

        self.assertEqual(result["status"], "Dangerous")
        self.assertGreaterEqual(result["risk_score"], 70)
        self.assertTrue(result["reasons"])

    def test_predict_unrecognized_tld_as_suspicious(self):
        result = predict_url("https://w22.igore.ckm")

        self.assertEqual(result["status"], "Suspicious")
        self.assertGreaterEqual(result["risk_score"], 40)
        self.assertLess(result["risk_score"], 70)
        self.assertTrue(any(reason["code"] == "unrecognized_tld" for reason in result["reasons"]))

    def test_predicts_brand_lookalike_as_dangerous(self):
        result = predict_url("https://githyb.com")

        self.assertEqual(result["status"], "Dangerous")
        self.assertGreaterEqual(result["risk_score"], 70)
        self.assertTrue(any(reason["code"] == "brand_lookalike" for reason in result["reasons"]))

    def test_predicts_lookalike_login_as_dangerous(self):
        result = predict_url("https://githyb.com/login")

        self.assertEqual(result["status"], "Dangerous")
        self.assertTrue(any(reason["code"] == "brand_lookalike" for reason in result["reasons"]))

    def test_preserves_official_login_domains_as_safe(self):
        for url in (
            "https://github.com/login",
            "https://login.microsoftonline.com",
            "https://linkedin.com/login",
            "https://notion.so/login",
            "https://stripe.com/login",
        ):
            with self.subTest(url=url):
                result = predict_url(url)
                self.assertEqual(result["status"], "Safe")
                self.assertLess(result["risk_score"], 40)

    def test_needs_structural_evidence_for_a_dangerous_verdict(self):
        result = predict_url("https://secure-login-update.com")

        self.assertEqual(result["status"], "Suspicious")
        self.assertTrue(any(reason["code"] == "credential_keyword" for reason in result["reasons"]))

    def test_model_info_reports_free_tier_posture(self):
        info = model_info()

        self.assertTrue(info["model_loaded"])
        self.assertEqual(info["feature_count"], 47)
        self.assertIn("aws_free_tier_posture", info)
        self.assertGreaterEqual(info["metrics_summary"]["recall"], 0.99)

    def test_flask_predict_endpoint(self):
        client = api.app.test_client()
        response = client.post("/predict", json={"url": "https://github.com"})

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["status"], "Safe")
        self.assertIn("model_version", payload)

    def test_lambda_predict_endpoint(self):
        event = {
            "rawPath": "/predict",
            "requestContext": {"http": {"method": "POST"}},
            "body": json.dumps({"url": "https://paypal-security-login.xyz/verify"}),
        }

        response = lambda_handler(event, None)
        payload = json.loads(response["body"])

        self.assertEqual(response["statusCode"], 200)
        self.assertEqual(payload["status"], "Dangerous")
        self.assertIn("reasons", payload)


if __name__ == "__main__":
    unittest.main()
