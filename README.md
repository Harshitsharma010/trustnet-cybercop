# TrustNet CyberCop

**Cloud-ready phishing URL detection platform with a Flask ML API, React dashboard, Chrome extension workflow, Docker setup, and AWS deployment configuration.**

TrustNet CyberCop is a cybersecurity project that analyzes suspicious URLs before a user opens them. It combines machine learning inference, URL feature extraction, a REST API, a dashboard interface, and a Chrome extension workflow to demonstrate how phishing detection can be packaged as a practical cloud-ready security tool.

> **Project status**  
> Built as a portfolio and hackathon-origin project. The repository includes working application code, a trained local model artifact, Docker/Gunicorn setup, and AWS deployment configuration. It is not presented as a production security product.

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
| ML phishing detection | Uses URL-derived features and a trained `RandomForestClassifier` to estimate phishing risk |
| Flask REST API | Provides `/`, `/health`, and `/predict` endpoints for service status and URL scanning |
| React dashboard | Allows users to submit URLs and view risk verdicts from the browser |
| Chrome extension | Provides a suspicious-link checking workflow through a Manifest V3 extension |
| Docker backend | Runs the Flask API with Gunicorn inside a container |
| AWS deployment config | Includes App Runner and Amplify configuration files for cloud deployment planning |
| Logging | Logs prediction metadata including URL checked, verdict, score, and response time |
| API validation | Handles missing URLs, empty input, long URLs, invalid schemes, missing model files, and prediction errors |

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Backend API | Python, Flask, Flask-CORS, Gunicorn |
| Machine Learning | scikit-learn, pandas, NumPy, SciPy, joblib, RandomForestClassifier |
| Frontend Dashboard | React, Vite, TypeScript |
| Browser Extension | Chrome Manifest V3, JavaScript, HTML, CSS |
| Containerization | Docker |
| Cloud Deployment Plan | AWS App Runner, AWS Amplify Hosting |
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
RandomForest ML Model
  |
  | returns class + probability
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
AWS App Runner
  |
  | runs Flask + Gunicorn API
  | exposes /health and /predict
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

**Backend plan**

- Deploy the Flask API to **AWS App Runner**.
- Use `apprunner.yaml` from the repository root.
- Install dependencies from `backend/requirements.txt`.
- Start the service with Gunicorn:

```bash
gunicorn --chdir backend -w 2 -b 0.0.0.0:5000 api:app
```

**Frontend plan**

- Deploy the React dashboard to **AWS Amplify Hosting**.
- Use `dashboard` as the app root.
- Use the included `amplify.yml`.
- Set `VITE_API_BASE_URL` to the App Runner backend URL.

**Proof to add after deployment**

- `[Add App Runner health endpoint screenshot]`
- `[Add Amplify dashboard URL]`
- `[Add deployed prediction request screenshot]`
- `[Add AWS console deployment screenshot]`

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

### `POST /predict`

Analyzes a URL and returns a phishing risk verdict.

Request:

```http
POST /predict
Content-Type: application/json
```

```json
{
  "url": "https://example.com"
}
```

Example response:

```json
{
  "url": "https://example.com",
  "status": "Safe",
  "phishing_chance": 0.0,
  "prediction": 0,
  "response_time_ms": 158.8
}
```

### Status Logic

| Phishing Chance | Status |
| ---: | --- |
| `0% - 39.9%` | `Safe` |
| `40% - 69.9%` | `Suspicious` |
| `70% - 100%` | `Dangerous` |

## ML Detection Workflow

The backend converts a submitted URL into model-ready features before prediction.

```text
Submitted URL
  |
  v
URL validation
  |
  v
Feature extraction
  |
  |-- IP address in hostname
  |-- URL length
  |-- URL shortener usage
  |-- @ symbol
  |-- double slash redirect pattern
  |-- prefix/suffix hyphen in domain
  |-- number of subdomains
  |-- fake HTTPS token in domain
  |-- suspicious keywords
  v
pandas DataFrame
  |
  v
RandomForestClassifier
  |
  v
Prediction + probability
```

The model is trained using `backend/train_model.py`, which pulls the UCI phishing dataset, maps selected dataset fields to the local feature schema, trains a balanced RandomForest classifier, and saves the model as `backend/model.pkl`.

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
  -d "{\"url\":\"https://example.com\"}"
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
VITE_API_BASE_URL=https://your-app-runner-url.awsapprunner.com
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
|   |-- feature_extractor.py
|   |-- train_model.py
|   |-- model.pkl
|   |-- requirements.txt
|   `-- Dockerfile
|-- dashboard/
|   |-- src/
|   |-- package.json
|   |-- vite.config.ts
|   `-- tsconfig.json
|-- extension/
|   `-- fixed_extension/
|-- manifest.json
|-- background.js
|-- content.js
|-- popup.html
|-- popup.js
|-- sandbox.html
|-- sandbox.js
|-- sandbox.css
|-- apprunner.yaml
|-- amplify.yml
|-- AWS_DEPLOYMENT.md
`-- README.md
```

## Screenshots / Demo Proof

Add proof here after capturing the working app.

| Proof | Status |
| --- | --- |
| Dashboard screenshot | `[Add Screenshot]` |
| Prediction result screenshot | `[Add Screenshot]` |
| Chrome extension popup screenshot | `[Add Screenshot]` |
| API health check screenshot | `[Add Screenshot]` |
| Docker container running screenshot | `[Add Screenshot]` |
| AWS App Runner deployment screenshot | `[Add Screenshot]` |
| AWS Amplify deployment screenshot | `[Add Screenshot]` |
| Short demo video or GIF | `[Add Demo Link]` |

Suggested file paths:

```text
docs/screenshots/dashboard.png
docs/screenshots/prediction-result.png
docs/screenshots/extension-popup.png
docs/screenshots/api-health.png
docs/screenshots/aws-apprunner.png
docs/screenshots/aws-amplify.png
```

## Security Considerations

- The API validates missing, empty, overly long, and non-HTTP/HTTPS URL inputs.
- CORS can be restricted through `ALLOWED_ORIGINS`.
- Prediction errors are handled with structured JSON responses.
- The model file is loaded at service startup and reported through `/health`.
- The project should not be used as the only defense against phishing.
- For real deployment, add API rate limiting, stricter CORS, request logging controls, abuse protection, and monitoring.

## Limitations

This project is intentionally scoped as a portfolio and learning project. The current implementation demonstrates the end-to-end workflow, but production usage would require additional safeguards:

- Model performance needs a documented evaluation report.
- URL-only detection cannot catch every phishing attack.
- Domain reputation, WHOIS, DNS, and page-content analysis are not included yet.
- The Chrome extension flow is designed for demonstration and testing.
- Cloud deployment configs are included, but live deployment proof should be added after hosting.

## Future Improvements

| Area | Improvement |
| --- | --- |
| AWS | Add deployed App Runner and Amplify URLs with screenshots |
| CI/CD | Add GitHub Actions for backend checks and dashboard build |
| Monitoring | Add CloudWatch logs, metrics, and alarms |
| Security | Add rate limiting, stricter CORS, request size limits, and safer logging |
| ML | Add dataset documentation, evaluation metrics, confusion matrix, and retraining notes |
| Product | Add scan history, downloadable reports, and richer dashboard analytics |
| Infrastructure | Add Terraform or AWS CDK for reproducible deployment |
| Extension | Add configurable API URL UI and clearer extension onboarding |

## License

This project is intended for educational, portfolio, and cybersecurity learning purposes.
