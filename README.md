# TrustNet CyberCop

> ML-powered phishing URL detection platform with a Flask inference API, React/Vite dashboard, Chrome extension sandbox flow, Docker support, and AWS-ready deployment configuration.

![Python](https://img.shields.io/badge/Python-3.11-blue)
![Flask](https://img.shields.io/badge/Backend-Flask-green)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB)
![Docker](https://img.shields.io/badge/Container-Docker-blue)
![AWS](https://img.shields.io/badge/Deploy-AWS%20Ready-orange)
![License](https://img.shields.io/badge/License-Educational-lightgrey)

---

## Overview

**TrustNet CyberCop** is a cybersecurity-focused project that helps users analyze suspicious URLs before opening them. It combines:

- A **machine learning phishing detection model**
- A **Flask REST API** for real-time URL prediction
- A **React + Vite dashboard** for checking URLs from a web interface
- A **Chrome extension** that opens suspicious links inside a sandbox-style flow
- **Docker + Gunicorn** for production-style backend serving
- **AWS App Runner + Amplify-ready configuration** for cloud deployment

The backend extracts URL-based security features, sends them to a trained `RandomForestClassifier`, and returns a safety status such as **Safe**, **Suspicious**, or **Dangerous**.

---

## Why This Project Matters

Phishing attacks often rely on fake login pages, urgent messages, shortened URLs, suspicious keywords, and misleading domains. TrustNet CyberCop demonstrates how machine learning, browser security workflows, and cloud deployment practices can be combined into a practical cybersecurity tool.

This project is useful for showcasing skills in:

- Machine learning inference
- Cybersecurity feature engineering
- REST API development
- Browser extension development
- React dashboard development
- Dockerized deployment
- AWS cloud deployment readiness

---

## Core Features

### Phishing Detection API
- Real-time URL risk analysis
- URL validation before prediction
- ML-based phishing probability scoring
- Response time tracking
- Health check endpoint for deployment monitoring
- Structured JSON API responses

### Machine Learning
- RandomForest-based phishing detection model
- URL feature extraction pipeline
- Detects suspicious patterns such as:
  - IP-based URLs
  - Long URLs
  - URL shorteners
  - `@` symbols
  - Multiple subdomains
  - Suspicious keywords
  - Fake HTTPS tokens inside domains

### Dashboard
- React + Vite frontend
- URL input and prediction flow
- API integration with Flask backend
- Production build support for AWS Amplify

### Chrome Extension
- Suspicious link interception
- Secure sandbox-style opening flow
- Omnibox support using the `sandbox` keyword
- Popup UI showing latest phishing result
- Option to open the original URL after checking

### DevOps / Cloud Readiness
- Dockerized Flask backend
- Gunicorn production server
- AWS App Runner configuration
- AWS Amplify frontend build configuration
- Environment-variable based frontend API URL
- Health endpoint for cloud monitoring

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Backend | Python, Flask, Flask-CORS, Gunicorn |
| Machine Learning | scikit-learn, pandas, NumPy, joblib, RandomForestClassifier |
| Frontend | React, Vite, TypeScript, JavaScript |
| Browser Extension | Chrome Manifest V3, JavaScript, HTML, CSS |
| DevOps | Docker, Gunicorn, AWS App Runner, AWS Amplify |
| Deployment Config | `apprunner.yaml`, `amplify.yml`, `AWS_DEPLOYMENT.md` |

---

## Project Structure

```txt
trustnet-cybercop/
│
├── backend/
│   ├── api.py                 # Flask API with prediction and health routes
│   ├── feature_extractor.py   # URL feature extraction logic
│   ├── model.pkl              # Trained ML model
│   ├── requirements.txt       # Backend Python dependencies
│   └── Dockerfile             # Backend container setup
│
├── dashboard/
│   ├── package.json           # React/Vite frontend scripts and dependencies
│   ├── src/                   # Dashboard source code
│   └── dist/                  # Production build output after npm run build
│
├── manifest.json              # Chrome extension manifest
├── background.js              # Extension background service worker
├── content.js                 # Suspicious link interception logic
├── popup.html                 # Extension popup UI
├── popup.js                   # Popup result rendering
├── sandbox.html               # Sandbox page
├── sandbox.js                 # Sandbox logic
├── sandbox.css                # Sandbox styling
│
├── apprunner.yaml             # AWS App Runner backend deployment config
├── amplify.yml                # AWS Amplify frontend deployment config
├── AWS_DEPLOYMENT.md          # Cloud deployment notes
└── README.md
```

---

## System Architecture

```txt
User / Browser / Dashboard
        │
        ▼
URL submitted for checking
        │
        ▼
Flask REST API
        │
        ▼
URL Feature Extraction
        │
        ▼
RandomForest ML Model
        │
        ▼
Prediction Response
(Safe / Suspicious / Dangerous)
```

### AWS Deployment Architecture

```txt
React Dashboard
   │
   ▼
AWS Amplify Hosting
   │
   ▼
Flask API on AWS App Runner
   │
   ▼
ML Inference Engine
   │
   ▼
Health Checks + Logs + Monitoring
```

---

## API Endpoints

### Root Endpoint

```http
GET /
```

Returns API service information and available endpoints.

### Health Check

```http
GET /health
```

Example response:

```json
{
  "status": "healthy",
  "model_loaded": true
}
```

### Predict URL

```http
POST /predict
Content-Type: application/json
```

Request body:

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

### Prediction Status Logic

| Phishing Chance | Status |
|---:|---|
| 0% - 39.9% | Safe |
| 40% - 69.9% | Suspicious |
| 70% - 100% | Dangerous |

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Harshitsharma010/trustnet-cybercop.git
cd trustnet-cybercop
```

### 2. Backend Setup

```bash
cd backend
python -m pip install -r requirements.txt
python api.py
```

Backend runs on:

```txt
http://127.0.0.1:5000
```

Test health endpoint:

```bash
curl http://127.0.0.1:5000/health
```

Test prediction endpoint:

```bash
curl -X POST http://127.0.0.1:5000/predict \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://example.com\"}"
```

### 3. Dashboard Setup

Open a new terminal:

```bash
cd dashboard
npm install
npm run dev
```

Dashboard runs locally on the Vite development server.

To create a production build:

```bash
npm run build
```

---

## Docker Setup

### Build Backend Image

```bash
cd backend
docker build -t trustnet-cybercop-api .
```

### Run Backend Container

```bash
docker run -p 5000:5000 trustnet-cybercop-api
```

Then open:

```txt
http://localhost:5000/health
```

---

## Chrome Extension Setup

1. Open Chrome.
2. Go to:

```txt
chrome://extensions/
```

3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the project root folder.
6. Use the extension popup or type the omnibox keyword:

```txt
sandbox <url>
```

The extension can intercept suspicious links and open them in the sandbox flow instead of directly navigating to the original URL.

---

## AWS Deployment Notes

This repository includes cloud deployment configuration for a two-service AWS setup:

### Backend: AWS App Runner

The backend can be deployed with AWS App Runner using `apprunner.yaml`.

Expected production command:

```bash
gunicorn --chdir backend -w 2 -b 0.0.0.0:5000 api:app
```

Health check endpoint:

```txt
https://your-app-runner-url.awsapprunner.com/health
```

Prediction endpoint:

```txt
https://your-app-runner-url.awsapprunner.com/predict
```

### Frontend: AWS Amplify

The React dashboard can be deployed with AWS Amplify using `amplify.yml`.

Set this environment variable in Amplify before building:

```txt
VITE_API_BASE_URL=https://your-app-runner-url.awsapprunner.com
```

### Extension API URL

The extension defaults to local backend usage. After deploying the backend, update the extension API base URL while testing:

```js
chrome.storage.sync.set({
  apiBaseUrl: "https://your-app-runner-url.awsapprunner.com"
});
```

---

## Security & Validation

The API includes basic validation for:

- Missing URL input
- Empty URL input
- URL length greater than 2048 characters
- URLs that do not start with `http://` or `https://`
- Missing ML model file
- Prediction runtime errors

> Note: This project is built for educational and portfolio purposes. It should not be used as the only security layer for real-world phishing protection.

---

## Project Highlights

- Built an end-to-end phishing detection platform using ML inference
- Designed a Flask API with clean `/health` and `/predict` endpoints
- Integrated a React/Vite dashboard for user-facing URL analysis
- Added Chrome extension support for safer suspicious-link handling
- Containerized the backend for production-style deployment
- Prepared AWS App Runner and Amplify deployment configuration
- Implemented URL feature extraction for phishing-risk classification

---

## Future Improvements

- Add user authentication
- Store scan history in a database
- Add rate limiting for API abuse protection
- Improve dashboard UI with charts and threat analytics
- Add CloudWatch logs and alerts
- Add GitHub Actions CI/CD pipeline
- Add Terraform infrastructure provisioning
- Add model evaluation metrics and dataset documentation
- Add domain reputation or WHOIS-based enrichment
- Add downloadable scan reports

---

## Screenshots

Add screenshots here after deployment:

```md
![Dashboard Screenshot](docs/screenshots/dashboard.png)
![Prediction Result](docs/screenshots/prediction-result.png)
![Chrome Extension Popup](docs/screenshots/extension-popup.png)
![AWS Architecture](docs/screenshots/aws-architecture.png)
```

---

## Author

**Harshit Sharma**

- GitHub: [Harshitsharma010](https://github.com/Harshitsharma010)

---

## License

This project is intended for educational, research, and cybersecurity learning purposes.
