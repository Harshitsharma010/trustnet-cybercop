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

    def test_model_info_reports_free_tier_posture(self):
        info = model_info()

        self.assertTrue(info["model_loaded"])
        self.assertEqual(info["feature_count"], 47)
        self.assertIn("aws_free_tier_posture", info)

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
