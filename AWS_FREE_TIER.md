# AWS Free Tier Deployment Guide

This project is designed so the impressive parts run locally or on demand, not as always-on expensive cloud workloads.

## Recommended Free-tier Shape

| Layer | Recommended AWS option | Why |
| --- | --- | --- |
| Dashboard | AWS Amplify Hosting | Static Vite build, no server process |
| API | AWS Lambda container + API Gateway HTTP API | Pay-per-request, no always-on container |
| Model training | Local machine | Avoid cloud compute cost |
| Model artifact | Included in Lambda image | Small enough for lightweight inference |
| Deep analysis | Optional request flag | Avoid network calls on every scan |

## Why Not Train On AWS?

Training belongs outside the free-tier deployment path. The checked-in API only loads `backend/model.pkl` and performs inference. Regenerate the model locally with:

```bash
cd backend
python train_model.py
```

Then deploy the updated artifact.

## Lambda Container Backend

The backend includes a Lambda-specific entry point:

```text
backend/lambda_handler.py
```

And a Lambda container Dockerfile:

```text
backend/Dockerfile.lambda
```

Build command:

```bash
cd backend
docker build -f Dockerfile.lambda -t trustnet-cybercop-lambda .
```

The Lambda handler supports:

| Method | Path |
| --- | --- |
| `GET` | `/health` |
| `GET` | `/model/info` |
| `GET` | `/model/metrics` |
| `POST` | `/predict` |
| `POST` | `/analyze` |

## Cost Controls Built Into The App

- Fast scans are URL-only and do not make external network calls.
- Deep scans are opt-in through `deep_scan: true` or `/analyze`.
- Deep scans skip private/local hosts to reduce SSRF risk.
- Deep scans use short request timeouts.
- Runtime dependencies are split with `requirements-lambda.txt`.
- The dashboard stores scan history in browser local storage, not a cloud database.

## Optional Non-free Path

`apprunner.yaml` is still available for a simpler container demo, but AWS App Runner can create always-on charges. Use Lambda/API Gateway when the goal is staying close to Free Tier.

## Environment Variables

| Variable | Used by | Purpose |
| --- | --- | --- |
| `ALLOWED_ORIGINS` | Backend | Restrict browser origins |
| `VITE_API_BASE_URL` | Dashboard | Point the static app to the deployed API |

For production-style demos, set `ALLOWED_ORIGINS` to the Amplify domain instead of `*`.
