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

## Evaluation Snapshot

The current checked-in model was trained with the deterministic local seed corpus in `backend/train_model.py`.

| Metric | Value |
| --- | ---: |
| Accuracy | 97.83% |
| Precision | 100.00% |
| Recall | 96.15% |
| F1 | 98.04% |
| ROC-AUC | 99.33% |

The full metrics payload is saved in `backend/model_metrics.json`.

## Intended Use

This model is intended for educational, portfolio, and interview demonstration use:

- Explain URL phishing indicators.
- Demonstrate ML inference behind a Flask/Lambda API.
- Show cost-aware cloud design.
- Support a dashboard and browser extension workflow.

It should not be used as the only protection layer for real users.

## Limitations

- The included seed corpus is deterministic and useful for reproducible demos, but it is not a replacement for a large, continuously refreshed real-world phishing feed.
- Fast mode does not fetch page content, DNS, WHOIS, screenshots, or reputation provider data.
- Deep mode only performs a short redirect inspection to stay free-tier friendly.
- Real production deployment should add rate limiting, abuse controls, monitoring, and a larger labeled dataset.

## Retraining

Train with the included seed corpus:

```bash
cd backend
python train_model.py
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
