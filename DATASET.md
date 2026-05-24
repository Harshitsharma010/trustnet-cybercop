# Dataset

TrustNet CyberCop now trains from a real public URL dataset by default.

## Default Dataset

| Item | Value |
| --- | --- |
| Name | PhiUSIIL Phishing URL Dataset |
| Source | UCI Machine Learning Repository |
| URL | https://archive.ics.uci.edu/dataset/967/phiusiil+phishing+url+dataset |
| License | Creative Commons Attribution 4.0 International (CC BY 4.0) |
| Full size | 235,795 URLs |
| Legitimate URLs | 134,850 |
| Phishing URLs | 100,945 |

## How Training Uses It

The trainer downloads the UCI archive into `data/raw/`, extracts the CSV, and reads only the URL and label columns. Raw dataset files are intentionally ignored by Git.

Default training uses a balanced 60,000-row sample:

```bash
python backend/train_model.py
```

Train on the full local dataset:

```bash
python backend/train_model.py --dataset phiusiil --max-samples 0
```

Train with your own `url,label` CSV:

```bash
python backend/train_model.py --dataset-csv path/to/urls.csv
```

## Why This Stays AWS Free Tier Friendly

- Training happens locally, not on AWS.
- The raw dataset is not deployed.
- AWS only loads `backend/model.pkl` for inference.
- The current model artifact is about 36 MB, practical for a Lambda container image.
- Fast scans remain URL-only and do not call external providers.
