from __future__ import annotations

import sys
import unittest
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from detector import load_model, predict_url


RISK_MATRIX = {
    "safe": [
        "https://docs.python.org/3/",
        "https://linkedin.com/login",
        "https://stripe.com/login",
    ],
    "suspicious": [
        "https://w22.igore.ckm",
        "https://q8x4r2z7n.com",
        "https://secure-login-update.com",
    ],
    "dangerous": [
        "https://githyb.com",
        "https://githxbz.com/login",
        "https://paypa1.com/verify",
        "https://dhl-track-delivery.xyz/verify",
        "http://45.77.12.10/login",
    ],
}


class UrlRiskMatrixTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        load_model()

    def test_url_risk_matrix(self):
        for expected_status, urls in RISK_MATRIX.items():
            for url in urls:
                with self.subTest(expected=expected_status, url=url):
                    self.assertEqual(predict_url(url)["status"], expected_status.title())


if __name__ == "__main__":
    unittest.main()
