# TrustNet CyberCop Model Card

## Model Summary

TrustNet CyberCop uses a lightweight hybrid phishing detector designed for portfolio demos and AWS Free Tier deployment. The backend extracts 47 URL intelligence features, runs a compact scikit-learn model, and blends the model probability with explainable risk signals.

| Item | Value |
| --- | --- |
| Model version | `trustnet-url-intel-v2` |
| Runtime profile | `free-tier-lightweight-hybrid` |
| Selected model | Extra Trees classifier |
| Feature count | 47 |
| Default scan mode | Fast URL-only inference |
| Optional scan mode | Deep redirect inspection with short timeout |
| Training location | Local/offline, not AWS-hosted |
| Dataset | UCI PhiUSIIL Phishing URL Dataset |

## Feature Groups

The feature extractor covers:

| Group | Examples |
| --- | --- |
| URL shape | URL length, path length, query length, slash count |
| Hostname structure | subdomain depth, dots, hyphens, hostname entropy |
| Security indicators | HTTP/HTTPS, IP host, custom port, punycode |
| Obfuscation | encoded characters, `@`, extra `//`, URL shorteners |
| Impersonation | brand keywords on untrusted domains |
| Intent keywords | credential, banking, urgency, wallet, billing terms |
| Payload hints | executable file extensions, free-hosting domains |

## Dataset

The checked-in model was trained locally on a balanced sample from the public **PhiUSIIL Phishing URL Dataset** in the UCI Machine Learning Repository.

| Dataset Item | Value |
| --- | ---: |
| Full dataset instances | 235,795 |
| Full legitimate URLs | 134,850 |
| Full phishing URLs | 100,945 |
| Training rows used in this model | 60,000 |
| Held-out evaluation rows | 15,000 |
| License | CC BY 4.0 |

The raw dataset is downloaded to `data/raw/` and intentionally excluded from Git. AWS only receives the compact trained model artifact.

## Evaluation Snapshot

| Metric | Value |
| --- | ---: |
| Accuracy | 99.65% |
| Precision | 99.80% |
| Recall | 99.51% |
| F1 | 99.65% |
| ROC-AUC | 99.79% |

The full metrics payload is saved in `backend/model_metrics.json`.

## Intended Use

This model is intended for educational, portfolio, and interview demonstration use:

- Explain URL phishing indicators.
- Demonstrate ML inference behind a Flask/Lambda API.
- Show cost-aware cloud design.
- Support a dashboard and browser extension workflow.

It should not be used as the only protection layer for real users.

## Limitations

- The included model uses a real public URL dataset, but production systems still need continuously refreshed phishing feeds.
- Fast mode does not fetch page content, DNS, WHOIS, screenshots, or reputation provider data.
- Deep mode only performs a short redirect inspection to stay free-tier friendly.
- Real production deployment should add rate limiting, abuse controls, monitoring, and a larger labeled dataset.

## Retraining

Train with the default UCI PhiUSIIL dataset sample:

```bash
cd backend
python train_model.py
```

Train with the full local PhiUSIIL dataset:

```bash
cd backend
python train_model.py --dataset phiusiil --max-samples 0
```

Run a small deterministic smoke-training pass:

```bash
cd backend
python train_model.py --dataset seed
```

Train with a real labeled CSV:

```bash
cd backend
python train_model.py --dataset-csv path/to/urls.csv
```

The CSV must include:

```text
url,label
https://example.com,0
http://fake-login.example,1
```
