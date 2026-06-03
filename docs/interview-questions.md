# Interview Questions

This document helps explain TrustNet CyberCop as a cloud, security, and ML portfolio project.

## Product And Security

### What problem does TrustNet solve?

TrustNet checks suspicious URLs and returns a risk verdict before the user opens the link. It is designed as a portfolio/security education project, not a replacement for production phishing protection.

### Why is this relevant to cloud security?

The project connects a security use case with cloud deployment: API Gateway exposes the API, Lambda runs inference, ECR stores the backend image, Amplify hosts the dashboard, and CloudWatch captures logs.

### What does the Chrome extension add?

The extension demonstrates a browser-side workflow where a user can scan a URL through the deployed API. It makes the project feel closer to a real user-facing security tool.

## AWS Architecture

### Why use Lambda container instead of EC2?

Lambda runs only when requests arrive, which is better for a Free Tier-conscious ML inference demo. A container image also keeps dependency packaging consistent.

### Why use API Gateway?

API Gateway provides a public HTTP boundary in front of Lambda. It exposes routes such as `/health`, `/predict`, and model metadata endpoints.

### Why use ECR?

ECR stores the backend Docker image used by Lambda. This demonstrates AWS container registry workflow.

### Why use Amplify?

Amplify hosts the React dashboard and connects the frontend deployment to GitHub. It keeps the frontend path simple while the backend remains serverless.

### What does CloudWatch prove?

CloudWatch proves that backend runtime logs and monitoring are available for deployed Lambda execution. It also supports alarms and log retention for cost control.

## ML And API

### What does the model do?

The model analyzes URL-derived features and estimates whether a URL is safe, suspicious, or dangerous.

### Why expose `/model/info` and `/model/metrics`?

These endpoints provide transparency. A reviewer can inspect model version, feature count, and saved evaluation metrics instead of trusting a black-box claim.

### Why is fast scan the default?

Fast scan avoids external network fetches by default. That reduces latency, cost, and SSRF risk.

### Why is deep scan optional?

Deep scan can inspect redirects, but it may add latency and security risk. Keeping it opt-in is safer for a demo.

## Limitations

### Is this production-ready?

No. It is a portfolio and educational security project. Production use would require stronger abuse protection, rate limiting, monitoring, dataset validation, retraining strategy, and stricter deployment controls.

### What would you improve next?

The next improvements would be Terraform/CDK infrastructure, stricter CORS, API abuse protection, structured monitoring, safer logging, and a more mature retraining pipeline.
