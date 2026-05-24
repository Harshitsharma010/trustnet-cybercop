# AWS Deployment

This repo supports two backend deployment paths:

1. **Recommended Free Tier path:** Lambda container + API Gateway HTTP API.
2. **Optional simple demo path:** App Runner with Flask/Gunicorn.

Use the Lambda path when your priority is avoiding always-on compute charges.

## Backend: Lambda Container + API Gateway

The Lambda path uses:

```text
backend/lambda_handler.py
backend/Dockerfile.lambda
backend/requirements-lambda.txt
```

Build the image locally:

```bash
cd backend
docker build -f Dockerfile.lambda -t trustnet-cybercop-lambda .
```

Push the image to Amazon ECR, create a Lambda function from the image, then expose it through API Gateway HTTP API.

The handler supports:

```text
GET  /health
GET  /model/info
GET  /model/metrics
POST /predict
POST /analyze
```

Recommended environment variable:

```text
ALLOWED_ORIGINS=https://your-amplify-domain.amplifyapp.com
```

## Frontend: AWS Amplify Hosting

Deploy Amplify from the same GitHub repository and use the `dashboard` app root. The root `amplify.yml` builds the Vite app and publishes `dashboard/dist`.

Set this Amplify environment variable before building:

```text
VITE_API_BASE_URL=https://your-api-gateway-url
```

## Optional Backend: AWS App Runner

App Runner is simpler for Flask/Gunicorn demos, but it can create always-on charges. Use it only if you are comfortable with that cost model.

Use the repository root as the App Runner source directory. App Runner will read `apprunner.yaml`, install `backend/requirements.txt`, and start:

```bash
gunicorn --chdir backend -w 2 -b 0.0.0.0:5000 api:app
```

## Chrome Extension API URL

The extension defaults to `http://127.0.0.1:5000`. After backend deployment, set the deployed URL in Chrome extension storage:

```js
chrome.storage.sync.set({
  apiBaseUrl: "https://your-api-gateway-url"
});
```

Run that from the extension service worker console while testing the unpacked extension.

## Cost Notes

See [AWS_FREE_TIER.md](AWS_FREE_TIER.md) for the cost-control plan. The important rule is: train locally, deploy only the model artifact, keep fast scans default, and use deep scans only when needed.
