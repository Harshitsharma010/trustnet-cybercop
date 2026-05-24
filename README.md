# TrustNet CyberCop

**Cloud-ready phishing URL intelligence platform with a feature-rich ML API, React dashboard, Chrome extension workflow, Lambda/App Runner deployment options, Docker setup, and AWS Free Tier conscious architecture.**

TrustNet CyberCop is a cybersecurity project that analyzes suspicious URLs before a user opens them. It combines 47-feature URL intelligence, lightweight ML inference, explainable risk reasons, a REST API, a dashboard interface, and a Chrome extension workflow to demonstrate how phishing detection can be packaged as a practical cloud-ready security tool.

> **Project status**  
> Built as a portfolio and hackathon-origin project. The repository includes working application code, a trained local model artifact, model metrics, Docker/Gunicorn setup, Lambda container support, and AWS deployment configuration. It is not presented as a production security product.

## 2026 Upgrade Highlights

| Upgrade | What changed |
| --- | --- |
| Feature-rich detector | Replaced the old 9-feature URL model path with a 47-feature URL intelligence pipeline |
| Hybrid scoring | Blends scikit-learn model probability with explainable heuristic risk signals |
| Explainable API | Returns verdict, risk score, model score, signal score, confidence, ranked reasons, features, and model version |
| Model evidence | Adds `backend/model_metrics.json`, `/model/info`, `/model/metrics`, and `MODEL_CARD.md` |
| AWS Free Tier path | Adds `backend/lambda_handler.py`, `backend/Dockerfile.lambda`, and `AWS_FREE_TIER.md` |
| Dashboard intelligence | Shows fast/deep scan mode, model metadata, evaluation metrics, top features, and risk reasons |

## Why This Project Matters

Phishing remains one of the most common ways users are tricked into sharing credentials or opening unsafe links. TrustNet CyberCop demonstrates a practical security workflow:

1. Accept a URL from a dashboard, API client, or Chrome extension.
2. Extract phishing-relevant URL signals.
3. Run the signals through an ML model.
4. Return a clear risk verdict: `Safe`, `Suspicious`, or `Dangerous`.
5. Surface the result through a user-facing dashboard or extension workflow.

This project is relevant for cloud, cybersecurity, AI/ML, and full-stack internship roles because it connects model inference, REST API design, frontend UX, browser extension behavior, Dockerized deployment, and AWS hosting configuration.

## Key Features

| Feature | Description |
| --- | --- |
| ML phishing detection | Uses 47 URL-derived features and a trained Extra Trees model to estimate phishing risk |
| Explainable risk scoring | Returns ranked risk reasons such as brand impersonation, IP host, URL shortener, risky TLD, and credential keywords |
| Fast and deep scan modes | Fast mode stays URL-only for cheap inference; deep mode optionally checks redirects with short timeouts |
| Flask REST API | Provides `/`, `/health`, and `/predict` endpoints for service status and URL scanning |
| Lambda API handler | Provides an AWS Lambda/API Gateway path for Free Tier friendly pay-per-request hosting |
| React dashboard | Allows users to submit URLs and view risk verdicts from the browser |
| Chrome extension | Provides a suspicious-link checking workflow through a Manifest V3 extension |
| Docker backend | Runs the Flask API with Gunicorn inside a container |
| AWS deployment config | Includes App Runner and Amplify configuration files for cloud deployment planning |
| Logging | Logs prediction metadata including URL checked, verdict, score, and response time |
| API validation | Handles missing URLs, empty input, long URLs, invalid schemes, missing model files, and prediction errors |
| Model reporting | Exposes model version, feature count, training metrics, top features, and Free Tier posture |

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Backend API | Python, Flask, Flask-CORS, Gunicorn |
| Machine Learning | scikit-learn, NumPy, SciPy via scikit-learn, joblib, ExtraTreesClassifier |
| Frontend Dashboard | React, Vite, TypeScript |
| Browser Extension | Chrome Manifest V3, JavaScript, HTML, CSS |
| Containerization | Docker |
| Cloud Deployment Plan | AWS Lambda container + API Gateway, AWS Amplify Hosting, optional AWS App Runner |
| Configuration | `apprunner.yaml`, `amplify.yml`, environment variables |

## System Architecture

```text
User
  |
  | submits URL
  v
React Dashboard / Chrome Extension / API Client
  |
  | POST /predict
  v
Flask REST API
  |
  | validates URL
  v
Feature Extraction Pipeline
  |
  | creates model input features
  v
Hybrid ML Detector
  |
  | returns class, probability, and ranked reasons
  v
Risk Response
  |
  | Safe / Suspicious / Dangerous
  v
Dashboard or Extension UI
```

## AWS Free Tier Deployment Plan

```text
GitHub Repository
  |
  | source deployment
  v
AWS Lambda Container + API Gateway
  |
  | loads backend/model.pkl
  | exposes /health, /predict, /analyze, /model/*
  v
TrustNet Backend API

GitHub Repository
  |
  | dashboard app root
  v
AWS Amplify Hosting
  |
  | builds Vite React app
  | uses VITE_API_BASE_URL
  v
TrustNet Dashboard
```

**Backend plan, recommended for Free Tier**

- Train locally and deploy only the saved model artifact.
- Package the backend with `backend/Dockerfile.lambda`.
- Use API Gateway HTTP API in front of Lambda.
- Keep fast scans as the default and use deep scans only on demand.

```bash
cd backend
docker build -f Dockerfile.lambda -t trustnet-cybercop-lambda .
```

**Backend plan, optional container demo**

App Runner is simpler for Flask/Gunicorn demos, but it can create always-on charges. Use it only when you are comfortable with that cost model.

```bash
gunicorn --chdir backend -w 2 -b 0.0.0.0:5000 api:app
```

**Frontend plan**

- Deploy the React dashboard to **AWS Amplify Hosting**.
- Use `dashboard` as the app root.
- Use the included `amplify.yml`.
- Set `VITE_API_BASE_URL` to the API Gateway backend URL.

**Proof to add after deployment**

- `[Add API Gateway health endpoint screenshot]`
- `[Add Amplify dashboard URL]`
- `[Add deployed prediction request screenshot]`
- `[Add AWS console deployment screenshot]`

See [AWS_FREE_TIER.md](AWS_FREE_TIER.md) for the cost-control details.

## API Endpoints

### `GET /`

Returns service metadata and available endpoints.

Example response:

```json
{
  "service": "TrustNet CyberCop phishing detection API",
  "status": "running",
  "model_loaded": true,
  "endpoints": {
    "health": "/health",
    "predict": "/predict"
  }
}
```

### `GET /health`

Used for local checks, container health checks, and cloud monitoring.

Example response:

```json
{
  "status": "healthy",
  "model_loaded": true
}
```

### `GET /model/info`

Returns model metadata, feature count, thresholds, metrics summary, and AWS Free Tier posture.

### `GET /model/metrics`

Returns the saved evaluation payload from `backend/model_metrics.json`, including selected model, training sample count, precision, recall, F1, ROC-AUC, confusion matrix, and top feature importances.

### `POST /predict`

Runs the default fast scan. Fast scan is lightweight and does not perform external fetches.

Request:

```http
POST /predict
Content-Type: application/json
```

```json
{
  "url": "https://example.com",
  "deep_scan": false
}
```

Example response:

```json
{
  "url": "https://example.com",
  "final_url": "https://example.com",
  "status": "Safe",
  "verdict": "Safe",
  "risk_score": 1.3,
  "phishing_chance": 1.3,
  "confidence": "High",
  "model_score": 0.0,
  "heuristic_score": 4.0,
  "prediction": 0,
  "model_version": "trustnet-url-intel-v2",
  "feature_count": 47,
  "reasons": [],
  "response_time_ms": 158.8
}
```

### `POST /analyze`

Runs deep mode. Deep mode performs a short-timeout redirect inspection and is opt-in to control cost and latency.

### Status Logic

| Risk Score | Status |
| ---: | --- |
| `0% - 39.9%` | `Safe` |
| `40% - 69.9%` | `Suspicious` |
| `70% - 100%` | `Dangerous` |

## ML Detection Workflow

The backend converts a submitted URL into model-ready features before prediction. The deployed path is intentionally lightweight: training happens locally, while AWS only loads the saved model artifact for inference.

```text
Submitted URL
  |
  v
URL validation
  |
  v
Feature extraction
  |
  |-- URL length, path length, query length
  |-- hostname entropy, dots, hyphens, subdomain depth
  |-- IP host, HTTP usage, punycode, custom port
  |-- shortener, @ symbol, encoded characters, double slash
  |-- brand impersonation and suspicious keyword groups
  |-- risky TLD, executable path, free hosting domain
  v
Feature vector
  |
  v
Extra Trees model + explainable signal scoring
  |
  v
Prediction + risk reasons + confidence
```

The model is trained using `backend/train_model.py`, which builds a deterministic local seed corpus by default, compares multiple lightweight scikit-learn models, selects the strongest model by phishing-focused metrics, and saves both `backend/model.pkl` and `backend/model_metrics.json`.

For a larger real-world run, pass a CSV with `url,label` columns:

```bash
cd backend
python train_model.py --dataset-csv path/to/urls.csv
```

## Chrome Extension Workflow

The Chrome extension provides a browser-side workflow for safer URL handling.

```text
User enters or clicks a URL
  |
  v
Extension background/content script
  |
  v
Sandbox page opens with encoded URL
  |
  v
URL is checked against the Flask API
  |
  v
Result is shown to the user
  |
  v
User can decide whether to open the original URL
```

Extension capabilities in this repository:

- Manifest V3 configuration
- Omnibox keyword support using `sandbox`
- Background service worker
- Content script flow
- Popup UI for latest phishing result
- Sandbox page for controlled link review

## Local Development Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker Desktop, optional
- Chrome browser, for extension testing

### 1. Clone the repository

```bash
git clone https://github.com/Harshitsharma010/trustnet-cybercop.git
cd trustnet-cybercop
```

### 2. Run the Flask backend

```bash
cd backend
python -m pip install -r requirements.txt
python api.py
```

Backend URL:

```text
http://127.0.0.1:5000
```

Health check:

```bash
curl http://127.0.0.1:5000/health
```

Prediction request:

```bash
curl -X POST http://127.0.0.1:5000/predict \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://example.com\",\"deep_scan\":false}"
```

Model metadata:

```bash
curl http://127.0.0.1:5000/model/info
curl http://127.0.0.1:5000/model/metrics
```

### 3. Run the React dashboard

Open a second terminal:

```bash
cd dashboard
npm install
npm run dev
```

Production build:

```bash
npm run build
```

### 4. Run backend tests

```bash
python -m unittest discover -s backend/tests
```

## Docker Setup

The backend includes a Dockerfile that runs the Flask API through Gunicorn.

```bash
cd backend
docker build -t trustnet-cybercop-api .
docker run -p 5000:5000 trustnet-cybercop-api
```

Verify the container:

```bash
curl http://localhost:5000/health
```

The Dockerfile also includes a health check against `/health`.

## Environment Variables

| Variable | Used By | Required | Description |
| --- | --- | --- | --- |
| `ALLOWED_ORIGINS` | Flask API | Optional | CORS allowlist. Defaults to `*` for local/demo use |
| `VITE_API_BASE_URL` | React dashboard | Optional locally, recommended for deployment | Backend API base URL. Defaults to `http://127.0.0.1:5000` |

Example dashboard deployment value:

```text
VITE_API_BASE_URL=https://your-api-gateway-url
```

Example backend deployment value:

```text
ALLOWED_ORIGINS=https://your-amplify-app-url.amplifyapp.com
```

## Project Structure

```text
trustnet-cybercop/
|-- backend/
|   |-- api.py
|   |-- detector.py
|   |-- feature_extractor.py
|   |-- lambda_handler.py
|   |-- model_config.py
|   |-- train_model.py
|   |-- model.pkl
|   |-- model_metrics.json
|   |-- requirements.txt
|   |-- requirements-lambda.txt
|   |-- Dockerfile
|   |-- Dockerfile.lambda
|   `-- tests/
|-- dashboard/
|   |-- src/
|   |-- package.json
|   |-- vite.config.ts
|   `-- tsconfig.json
|-- extension/
|   `-- fixed_extension/
|-- apprunner.yaml
|-- amplify.yml
|-- AWS_DEPLOYMENT.md
|-- AWS_FREE_TIER.md
|-- MODEL_CARD.md
`-- README.md
```

## Screenshots / Demo Proof

The repository includes local proof assets for the upgraded dashboard and API. Cloud deployment screenshots can be added after the AWS Lambda/API Gateway and Amplify deployment is live.

### Dashboard Preview

![TrustNet CyberCop dashboard showing the URL scanner, risk panel, session stats, and model evidence section](docs/screenshots/dashboard.png)

### Proof Matrix

| Proof Area | Status | Evidence |
| --- | --- | --- |
| Dashboard UI | Included | [Dashboard screenshot](docs/screenshots/dashboard.png) |
| API health | Included | [API health screenshot](docs/screenshots/api-health.png) |
| Prediction API | Verified | `backend/tests/test_detector_api.py` covers safe and dangerous URL predictions |
| Model metrics | Included | `backend/model_metrics.json` and [MODEL_CARD.md](MODEL_CARD.md) |
| AWS Free Tier path | Included | [AWS_FREE_TIER.md](AWS_FREE_TIER.md), `backend/lambda_handler.py`, `backend/Dockerfile.lambda` |
| React production build | Verified | `npm run build` passes for the Vite dashboard |
| Backend tests | Verified | `python -m unittest discover -s backend/tests` passes |
| Chrome extension workflow | Included | Canonical Manifest V3 extension in `extension/fixed_extension/` |
| Cloud deployment proof | Pending | Add Lambda/API Gateway and Amplify screenshots after hosting |

### API Health Proof

The local Flask API reports the upgraded model version, feature count, and Free Tier friendly profile:

```json
{
  "feature_count": 47,
  "model_loaded": true,
  "model_version": "trustnet-url-intel-v2",
  "profile": "free-tier-lightweight-hybrid",
  "status": "healthy"
}
```

## Security Considerations

- The API validates missing, empty, overly long, and non-HTTP/HTTPS URL inputs.
- CORS can be restricted through `ALLOWED_ORIGINS`.
- Prediction errors are handled with structured JSON responses.
- The model file is loaded at service startup and reported through `/health`.
- Deep scans skip private/local hosts to reduce SSRF risk.
- Fast scans do not perform external network fetches by default.
- The project should not be used as the only defense against phishing.
- For real deployment, add API rate limiting, stricter CORS, request logging controls, abuse protection, and monitoring.

## Limitations

This project is intentionally scoped as a portfolio and learning project. The current implementation demonstrates the end-to-end workflow, but production usage would require additional safeguards:

- The included model metrics are based on the deterministic local seed corpus; use `--dataset-csv` for a larger real phishing feed.
- URL-only detection cannot catch every phishing attack.
- Domain reputation, WHOIS, DNS, screenshot, and page-content analysis are intentionally not included in fast mode to keep AWS costs low.
- The Chrome extension flow is designed for demonstration and testing.
- Cloud deployment configs are included, but live deployment proof should be added after hosting.

## Future Improvements

| Area | Improvement |
| --- | --- |
| AWS | Add deployed Lambda/API Gateway and Amplify URLs with screenshots |
| CI/CD | Add GitHub Actions for backend checks and dashboard build |
| Monitoring | Add CloudWatch logs, metrics, and alarms |
| Security | Add rate limiting, stricter CORS, request size limits, and safer logging |
| ML | Train against a larger real labeled URL feed and compare against the seed-corpus baseline |
| Product | Add scan history, downloadable reports, and richer dashboard analytics |
| Infrastructure | Add Terraform or AWS CDK for reproducible deployment |
| Extension | Add configurable API URL UI and clearer extension onboarding |

## License

This project is intended for educational, portfolio, and cybersecurity learning purposes.
