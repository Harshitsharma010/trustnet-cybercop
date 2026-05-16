from __future__ import annotations

from io import StringIO
from pathlib import Path
from urllib.request import urlopen

import joblib
import pandas as pd
from scipy.io import arff
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

DATASET_URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/00327/Training%20Dataset.arff"
MODEL_PATH = Path(__file__).with_name("model.pkl")
RANDOM_STATE = 42

FEATURE_COLUMNS = [
    "has_ip",
    "url_length",
    "has_shortener",
    "has_at",
    "has_double_slash",
    "has_prefix_suffix",
    "num_subdomains",
    "has_https_token",
    "has_keywords",
]

UCI_FEATURE_MAP = {
    "has_ip": "having_IP_Address",
    "url_length": "URL_Length",
    "has_shortener": "Shortining_Service",
    "has_at": "having_At_Symbol",
    "has_double_slash": "double_slash_redirecting",
    "has_prefix_suffix": "Prefix_Suffix",
    "num_subdomains": "having_Sub_Domain",
    "has_https_token": "HTTPS_token",
}


def _decode_arff_value(value):
    if isinstance(value, bytes):
        value = value.decode("utf-8")
    return int(value)


def _to_suspicious_feature(column_name: str, value) -> int:
    value = _decode_arff_value(value)

    if column_name in {"URL_Length", "having_Sub_Domain"}:
        return 0 if value == 1 else 1

    return 1 if value == -1 else 0


def load_training_data(url: str = DATASET_URL):
    with urlopen(url) as response:
        raw_data = response.read()

    records, _ = arff.loadarff(StringIO(raw_data.decode("utf-8")))
    df = pd.DataFrame(records)

    features = pd.DataFrame(index=df.index)
    for local_name, uci_name in UCI_FEATURE_MAP.items():
        features[local_name] = df[uci_name].map(lambda value, name=uci_name: _to_suspicious_feature(name, value))

    # The local feature extractor includes this URL keyword feature, but the UCI
    # ARFF dataset does not. Keep it as a stable zero column so prediction input
    # shape and ordering match feature_extractor.generate_features().
    features["has_keywords"] = 0
    features = features[FEATURE_COLUMNS].astype(int)

    target = df["Result"].map(lambda value: 1 if _decode_arff_value(value) == -1 else 0).astype(int)
    return features, target


def train_model():
    x, y = load_training_data()
    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.2,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    model = RandomForestClassifier(
        n_estimators=300,
        random_state=RANDOM_STATE,
        class_weight="balanced",
        n_jobs=-1,
    )
    model.fit(x_train, y_train)

    predictions = model.predict(x_test)
    print(f"Accuracy: {accuracy_score(y_test, predictions):.4f}")
    print(classification_report(y_test, predictions, target_names=["legitimate", "phishing"]))

    joblib.dump(model, MODEL_PATH)
    print(f"Saved model to {MODEL_PATH}")
    return model


if __name__ == "__main__":
    train_model()

