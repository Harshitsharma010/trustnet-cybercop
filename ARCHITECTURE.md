# TrustNet CyberCop Architecture

TrustNet CyberCop is deployed as a Free Tier-conscious AWS portfolio project. The main goal is to show how a browser-facing phishing URL scanner can connect to a serverless ML inference backend without running always-on infrastructure.

## Live Components

| Layer | Service | Responsibility |
| --- | --- | --- |
| Dashboard | AWS Amplify | Hosts the React/Vite frontend. |
| Browser workflow | Chrome extension | Sends suspicious URLs to the deployed API Gateway backend. |
| API entry point | API Gateway HTTP API | Exposes public routes such as `/health`, `/predict`, `/analyze`, `/model/info`, and `/model/metrics`. |
| Backend runtime | AWS Lambda container | Runs the Python ML inference backend from a container image. |
| Image storage | Amazon ECR | Stores the Lambda container image. |
| Model inference | scikit-learn model artifact | Loads `model.pkl` and scores extracted URL features. |
| Observability | CloudWatch Logs and alarms | Captures Lambda logs and monitors runtime health. |
| Abuse control | API Gateway throttling | Limits request bursts to protect Free Tier usage. |

## Request Flow

```text
User / Chrome Extension / React Dashboard
        |
        v
AWS Amplify Hosted Dashboard
        |
        v
API Gateway HTTP API
        |
        v
AWS Lambda Container
        |
        v
TrustNet ML Model + 47 URL Features
        |
        v
CloudWatch Logs and Alarms
```

1. A user submits a URL from the dashboard, extension, or API client.
2. The client sends a request to API Gateway.
3. API Gateway forwards the request to the Lambda container.
4. Lambda validates the URL and extracts 47 URL-derived features.
5. The model and heuristic scoring pipeline return a `Safe`, `Suspicious`, or `Dangerous` verdict.
6. Lambda writes execution logs to CloudWatch.
7. The dashboard or extension displays the result to the user.

## Backend Runtime

The backend has two runtime paths:

- Local/demo Flask API through `backend/api.py`.
- AWS Lambda handler through `backend/lambda_handler.py`.

The deployed AWS path uses the Lambda handler. The Lambda image is built from `backend/Dockerfile.lambda`, pushed to Amazon ECR, and attached to the Lambda function.

## Security Boundaries

The main untrusted input is the submitted URL. The backend protects the inference path by:

- Rejecting missing, empty, malformed, non-HTTP/HTTPS, and overly long URLs.
- Keeping `/predict` URL-only by default.
- Making deep scan optional through `/analyze` or `deep_scan: true`.
- Skipping private/local hosts during deep scan to reduce SSRF risk.
- Returning structured JSON errors instead of exposing stack traces.

The project does not use API keys, user accounts, databases, or stored customer secrets.

## AWS Security and Operations

Current AWS proof includes:

- ECR image storage for the Lambda container.
- Lambda function configuration.
- API Gateway routes and invoke URL.
- API Gateway throttling proof.
- CloudWatch log events.
- CloudWatch log retention set to 1 week.
- CloudWatch alarm proof for Lambda monitoring.
- Lambda IAM role permission proof.
- Amplify deployment proof.
- Chrome extension proof against the deployed API.

Recommended next hardening steps:

- Keep Lambda IAM permissions least-privilege.
- Keep CORS restricted to the Amplify dashboard domain for browser clients.
- Keep API Gateway throttling enabled to reduce accidental abuse and cost spikes.
- Keep CloudWatch alarms for Lambda errors, throttles, and high duration.

## Free Tier Design Choices

TrustNet avoids always-on infrastructure:

- Lambda runs only when requests arrive.
- API Gateway provides the public API layer without a server to manage.
- Amplify hosts a static frontend.
- CloudWatch log retention is limited to reduce long-term log storage.
- Model training happens locally; AWS only serves inference.

Services intentionally avoided for this version:

- EC2 as the primary backend runtime.
- App Runner as the primary backend runtime.
- RDS or DynamoDB for server-side history.
- NAT Gateway.
- SageMaker or Bedrock.

## Interview Summary

TrustNet CyberCop demonstrates a deployed serverless AWS security workflow:

```text
Amplify frontend + Chrome extension
        -> API Gateway HTTP API
        -> Lambda container from ECR
        -> ML URL-risk inference
        -> CloudWatch logs and alarms
```

It is best described as a portfolio-ready, Free Tier-conscious AWS cloud-security project, not as a production phishing defense service.
