from __future__ import annotations

import argparse
import csv
import json
import random
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlretrieve

import joblib
import numpy as np
from sklearn.ensemble import ExtraTreesClassifier, HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split

try:
    from feature_extractor import extract_url_intelligence
    from model_config import FEATURE_COLUMNS, METRICS_PATH, MODEL_PATH, MODEL_PROFILE, MODEL_VERSION, STATUS_THRESHOLDS
except ImportError:  # pragma: no cover - package import path
    from .feature_extractor import extract_url_intelligence
    from .model_config import FEATURE_COLUMNS, METRICS_PATH, MODEL_PATH, MODEL_PROFILE, MODEL_VERSION, STATUS_THRESHOLDS


RANDOM_STATE = 42
PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data" / "raw"
PHIUSIIL_ZIP_URL = "https://archive.ics.uci.edu/static/public/967/phiusiil+phishing+url+dataset.zip"
PHIUSIIL_ZIP_PATH = DATA_DIR / "phiusiil_phishing_url_dataset.zip"
PHIUSIIL_CSV_PATH = DATA_DIR / "PhiUSIIL_Phishing_URL_Dataset.csv"
DEFAULT_PHIUSIIL_SAMPLE_SIZE = 60000


LEGITIMATE_URLS = [
    "https://www.google.com/search?q=cybersecurity+awareness",
    "https://github.com/Harshitsharma010/trustnet-cybercop",
    "https://docs.github.com/en/actions",
    "https://openai.com/research/",
    "https://platform.openai.com/docs/overview",
    "https://www.microsoft.com/en-us/security",
    "https://support.microsoft.com/en-us/account-billing",
    "https://login.microsoftonline.com/",
    "https://www.apple.com/in/shop",
    "https://support.apple.com/en-in",
    "https://www.amazon.in/gp/help/customer/display.html",
    "https://www.amazon.com/ap/signin",
    "https://www.paypal.com/signin",
    "https://www.paypal.com/us/security",
    "https://www.netflix.com/login",
    "https://help.netflix.com/en",
    "https://www.instagram.com/accounts/login/",
    "https://www.facebook.com/login/",
    "https://web.whatsapp.com/",
    "https://www.linkedin.com/login",
    "https://www.hdfcbank.com/personal/resources/ways-to-bank/online-banking",
    "https://www.icicibank.com/personal-banking/insta-banking/internet-banking",
    "https://www.axisbank.com/bank-smart/internet-banking",
    "https://retail.onlinesbi.sbi/retail/login.htm",
    "https://paytm.com/",
    "https://www.phonepe.com/",
    "https://zerodha.com/",
    "https://kite.zerodha.com/",
    "https://www.coursera.org/learn/machine-learning",
    "https://www.kaggle.com/datasets",
    "https://scikit-learn.org/stable/modules/ensemble.html",
    "https://pandas.pydata.org/docs/",
    "https://aws.amazon.com/free/",
    "https://docs.aws.amazon.com/lambda/latest/dg/welcome.html",
    "https://aws.amazon.com/amplify/",
    "https://www.cloudflare.com/learning/security/threats/phishing-attack/",
    "https://owasp.org/www-project-top-ten/",
    "https://www.wikipedia.org/",
    "https://news.ycombinator.com/",
    "https://www.nist.gov/cyberframework",
]

PHISHING_BRANDS = [
    "amazon",
    "apple",
    "axis",
    "facebook",
    "github",
    "google",
    "hdfc",
    "icici",
    "instagram",
    "microsoft",
    "netflix",
    "openai",
    "paypal",
    "paytm",
    "phonepe",
    "sbi",
    "whatsapp",
    "zerodha",
]

RISKY_TLDS = ["click", "support", "top", "xyz", "info", "shop", "zip"]
PHISHING_WORDS = ["verify", "secure", "account", "billing", "unlock", "limited", "signin", "password"]


def _make_phishing_urls() -> list[str]:
    urls: list[str] = [
        "http://192.168.0.14/paypal/login/verify",
        "http://10.0.0.5/banking/otp/confirm",
        "http://secure-login.verify-account.com/update/password",
        "https://login-paypal-security.com.session-update.xyz/confirm?token=998812",
        "http://xn--paypa1-l2c.com/signin",
        "https://bit.ly/3secure-login",
        "http://tinyurl.com/account-verify-now",
        "https://example.com@malicious-login.click/secure",
        "https://safe.example.com//http://paypal.com/login",
        "https://billing-update-wallet-support.pages.dev/login",
        "https://free-gift-card-confirm.000webhostapp.com/apple",
        "http://downloads-security-update.shop/statement.exe",
    ]

    for index, brand in enumerate(PHISHING_BRANDS):
        tld = RISKY_TLDS[index % len(RISKY_TLDS)]
        word = PHISHING_WORDS[index % len(PHISHING_WORDS)]
        urls.extend(
            [
                f"http://{brand}-{word}-login.{tld}/confirm/password",
                f"https://secure-{brand}-account.{word}-{index}.{tld}/signin?session={index}8891&otp=true",
                f"https://{brand}.customer-{word}.service-alert.{tld}/update?ref=mail&case={index}",
                f"http://login.{brand}.account.{word}.security-check.{tld}/verify-now",
            ]
        )

    for index in range(18):
        brand = PHISHING_BRANDS[index % len(PHISHING_BRANDS)]
        urls.append(
            "https://"
            f"customer-{brand}-support-{index}-secure-login-update."
            f"{RISKY_TLDS[index % len(RISKY_TLDS)]}/"
            f"auth/session/{index}/password-reset?email=user{index}%40example.com&urgent=true&next=wallet"
        )

    return urls


def _make_legitimate_variants() -> list[str]:
    variants: list[str] = []
    trusted_domains = [
        "github.com",
        "google.com",
        "microsoft.com",
        "paypal.com",
        "amazon.com",
        "openai.com",
        "hdfcbank.com",
        "icicibank.com",
        "axisbank.com",
        "zerodha.com",
    ]

    for domain in trusted_domains:
        variants.extend(
            [
                f"https://{domain}/login",
                f"https://support.{domain}/help/account",
                f"https://www.{domain}/security/verify-device",
                f"https://{domain}/billing/history?month=2026-05",
            ]
        )

    return variants


def load_seed_dataset() -> list[tuple[str, int]]:
    rows = [(url, 0) for url in LEGITIMATE_URLS + _make_legitimate_variants()]
    rows.extend((url, 1) for url in _make_phishing_urls())
    return rows


def load_csv_dataset(path: Path) -> list[tuple[str, int]]:
    rows: list[tuple[str, int]] = []
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        if "url" not in reader.fieldnames or "label" not in reader.fieldnames:
            raise ValueError("CSV dataset must include url and label columns.")

        for item in reader:
            url = (item.get("url") or "").strip()
            label_raw = str(item.get("label") or "").strip().lower()
            if not url:
                continue
            label = 1 if label_raw in {"1", "phishing", "malicious", "dangerous", "bad"} else 0
            rows.append((url, label))

    if len(rows) < 20:
        raise ValueError("CSV dataset must contain at least 20 labeled rows.")

    return rows


def download_phiusiil_dataset(force: bool = False) -> Path:
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if PHIUSIIL_CSV_PATH.exists() and not force:
        return PHIUSIIL_CSV_PATH

    if force or not PHIUSIIL_ZIP_PATH.exists():
        print(f"Downloading PhiUSIIL dataset from {PHIUSIIL_ZIP_URL}")
        urlretrieve(PHIUSIIL_ZIP_URL, PHIUSIIL_ZIP_PATH)

    with zipfile.ZipFile(PHIUSIIL_ZIP_PATH) as archive:
        csv_members = [name for name in archive.namelist() if name.lower().endswith(".csv")]
        if not csv_members:
            raise ValueError("PhiUSIIL archive did not contain a CSV file.")

        member = csv_members[0]
        with archive.open(member) as source, PHIUSIIL_CSV_PATH.open("wb") as target:
            target.write(source.read())

    return PHIUSIIL_CSV_PATH


def _normalize_phiusiil_label(value: str) -> int:
    normalized = str(value or "").strip().lower()

    # PhiUSIIL uses 1 = legitimate and 0 = phishing. The TrustNet local
    # convention is 1 = phishing and 0 = legitimate.
    if normalized in {"0", "phishing", "malicious", "bad", "dangerous"}:
        return 1
    if normalized in {"1", "legitimate", "benign", "good", "safe"}:
        return 0

    raise ValueError(f"Unsupported PhiUSIIL label: {value!r}")


def load_phiusiil_dataset(path: Path = PHIUSIIL_CSV_PATH, max_samples: int | None = DEFAULT_PHIUSIIL_SAMPLE_SIZE) -> list[tuple[str, int]]:
    if not path.exists():
        path = download_phiusiil_dataset()

    legitimate: list[tuple[str, int]] = []
    phishing: list[tuple[str, int]] = []

    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise ValueError("PhiUSIIL CSV has no header row.")

        fields = {field.lower(): field for field in reader.fieldnames}
        url_field = fields.get("url")
        label_field = fields.get("label") or fields.get("class")

        if not url_field or not label_field:
            raise ValueError("PhiUSIIL CSV must include URL and label columns.")

        for item in reader:
            url = (item.get(url_field) or "").strip()
            if not url:
                continue

            label = _normalize_phiusiil_label(str(item.get(label_field, "")))
            if label == 1:
                phishing.append((url, label))
            else:
                legitimate.append((url, label))

    if not legitimate or not phishing:
        raise ValueError("PhiUSIIL dataset must include both legitimate and phishing rows.")

    rng = random.Random(RANDOM_STATE)
    rng.shuffle(legitimate)
    rng.shuffle(phishing)

    if max_samples and max_samples > 0:
        per_class = max(1, max_samples // 2)
        legitimate = legitimate[:per_class]
        phishing = phishing[:per_class]

    rows = legitimate + phishing
    rng.shuffle(rows)
    return rows


def vectorize(rows: list[tuple[str, int]]) -> tuple[np.ndarray, np.ndarray]:
    feature_rows = []
    labels = []

    for url, label in rows:
        intelligence = extract_url_intelligence(url)
        feature_rows.append([intelligence["features"][column] for column in FEATURE_COLUMNS])
        labels.append(label)

    return np.asarray(feature_rows, dtype=float), np.asarray(labels, dtype=int)


def candidate_models() -> dict[str, object]:
    return {
        "extra_trees": ExtraTreesClassifier(
            n_estimators=260,
            random_state=RANDOM_STATE,
            class_weight="balanced",
            min_samples_leaf=1,
            n_jobs=-1,
        ),
        "random_forest": RandomForestClassifier(
            n_estimators=320,
            random_state=RANDOM_STATE,
            class_weight="balanced",
            min_samples_leaf=2,
            n_jobs=-1,
        ),
        "hist_gradient_boosting": HistGradientBoostingClassifier(
            max_iter=180,
            learning_rate=0.07,
            random_state=RANDOM_STATE,
        ),
    }


def evaluate_model(model, x_test: np.ndarray, y_test: np.ndarray) -> dict[str, object]:
    predictions = model.predict(x_test)
    probabilities = model.predict_proba(x_test)[:, 1] if hasattr(model, "predict_proba") else predictions

    report = classification_report(
        y_test,
        predictions,
        target_names=["legitimate", "phishing"],
        output_dict=True,
        zero_division=0,
    )

    return {
        "accuracy": round(float(accuracy_score(y_test, predictions)), 4),
        "precision": round(float(precision_score(y_test, predictions, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, predictions, zero_division=0)), 4),
        "f1": round(float(f1_score(y_test, predictions, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, probabilities)), 4),
        "confusion_matrix": confusion_matrix(y_test, predictions).tolist(),
        "classification_report": report,
    }


def model_selection_score(metrics: dict[str, object]) -> float:
    return (
        float(metrics["recall"]) * 0.5
        + float(metrics["f1"]) * 0.35
        + float(metrics["precision"]) * 0.1
        + float(metrics["roc_auc"]) * 0.05
    )


def feature_importance(model) -> list[dict[str, float | str]]:
    if not hasattr(model, "feature_importances_"):
        return []

    values = getattr(model, "feature_importances_")
    ranked = sorted(zip(FEATURE_COLUMNS, values), key=lambda item: item[1], reverse=True)
    return [{"feature": feature, "importance": round(float(value), 5)} for feature, value in ranked[:16]]


def train_model(
    dataset_csv: Path | None = None,
    dataset: str = "phiusiil",
    max_samples: int | None = DEFAULT_PHIUSIIL_SAMPLE_SIZE,
    model_path: Path = MODEL_PATH,
    metrics_path: Path = METRICS_PATH,
):
    if dataset_csv:
        rows = load_csv_dataset(dataset_csv)
        source = str(dataset_csv)
    elif dataset == "phiusiil":
        rows = load_phiusiil_dataset(max_samples=max_samples)
        source = "UCI PhiUSIIL Phishing URL Dataset"
    elif dataset == "seed":
        rows = load_seed_dataset()
        source = "built-in deterministic URL seed corpus"
    else:
        raise ValueError(f"Unsupported dataset: {dataset}")

    x, y = vectorize(rows)

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.25,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    results = {}
    best_name = ""
    best_model = None
    best_score = -1.0

    for name, model in candidate_models().items():
        model.fit(x_train, y_train)
        metrics = evaluate_model(model, x_test, y_test)
        score = model_selection_score(metrics)
        results[name] = metrics

        if score > best_score:
            best_name = name
            best_model = model
            best_score = score

    if best_model is None:
        raise RuntimeError("No model was trained.")

    selected_metrics = results[best_name]
    importance = feature_importance(best_model)
    trained_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    metrics_payload = {
        "model_version": MODEL_VERSION,
        "model_profile": MODEL_PROFILE,
        "selected_model": best_name,
        "trained_at": trained_at,
        "training_samples": int(len(rows)),
        "feature_count": len(FEATURE_COLUMNS),
        "data_source": source,
        "dataset_reference": {
            "name": "PhiUSIIL Phishing URL Dataset" if dataset == "phiusiil" and not dataset_csv else source,
            "repository": "UCI Machine Learning Repository",
            "url": "https://archive.ics.uci.edu/dataset/967/phiusiil+phishing+url+dataset",
            "license": "Creative Commons Attribution 4.0 International (CC BY 4.0)",
            "full_instances": 235795,
            "full_legitimate_urls": 134850,
            "full_phishing_urls": 100945,
            "training_rows_used": int(len(rows)),
            "local_data_committed": False,
        },
        "selection_score": round(float(best_score), 4),
        "thresholds": STATUS_THRESHOLDS,
        "selected_metrics": selected_metrics,
        "candidate_metrics": results,
        "top_features": importance,
        "notes": [
            "Inference is lightweight and AWS Free Tier friendly.",
            "The model artifact is trained locally and deployed without shipping the raw dataset to AWS.",
            "Use --dataset seed only for deterministic smoke tests; default training uses the public UCI PhiUSIIL dataset.",
            "The API combines model probability with explainable URL risk signals.",
        ],
    }

    bundle = {
        "model": best_model,
        "feature_columns": FEATURE_COLUMNS,
        "model_version": MODEL_VERSION,
        "model_profile": MODEL_PROFILE,
        "trained_at": trained_at,
        "thresholds": STATUS_THRESHOLDS,
        "metrics": metrics_payload,
    }

    joblib.dump(bundle, model_path)
    metrics_path.write_text(json.dumps(metrics_payload, indent=2), encoding="utf-8")

    print(f"Selected model: {best_name}")
    print(f"Feature count: {len(FEATURE_COLUMNS)}")
    print(f"Training samples: {len(rows)}")
    print(f"Recall: {selected_metrics['recall']:.4f}")
    print(f"F1: {selected_metrics['f1']:.4f}")
    print(f"ROC-AUC: {selected_metrics['roc_auc']:.4f}")
    print(f"Saved model to {model_path}")
    print(f"Saved metrics to {metrics_path}")
    return bundle


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train the TrustNet CyberCop lightweight URL intelligence model.")
    parser.add_argument("--dataset-csv", type=Path, help="Optional CSV with url,label columns for real labeled data.")
    parser.add_argument("--dataset", choices=["phiusiil", "seed"], default="phiusiil", help="Built-in dataset loader to use when --dataset-csv is omitted.")
    parser.add_argument("--max-samples", type=int, default=DEFAULT_PHIUSIIL_SAMPLE_SIZE, help="Maximum rows to load from PhiUSIIL, balanced by class. Use 0 for full dataset.")
    parser.add_argument("--download-only", action="store_true", help="Download/extract the PhiUSIIL dataset and exit.")
    parser.add_argument("--force-download", action="store_true", help="Redownload the PhiUSIIL archive before training.")
    parser.add_argument("--model-path", type=Path, default=MODEL_PATH, help="Output model bundle path.")
    parser.add_argument("--metrics-path", type=Path, default=METRICS_PATH, help="Output metrics JSON path.")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    if args.download_only:
        path = download_phiusiil_dataset(force=args.force_download)
        print(f"Downloaded dataset to {path}")
    else:
        max_samples = None if args.max_samples == 0 else args.max_samples
        if args.force_download:
            download_phiusiil_dataset(force=True)
        train_model(
            dataset_csv=args.dataset_csv,
            dataset=args.dataset,
            max_samples=max_samples,
            model_path=args.model_path,
            metrics_path=args.metrics_path,
        )
