# Cloud Architecture Review

TrustNet CyberCop uses a serverless AWS architecture for a phishing URL detection workflow.

## Request Flow

```text
User / Chrome Extension / Dashboard
  |
  | HTTP request
  v
API Gateway HTTP API
  |
  v
AWS Lambda container
  |
  v
Flask API + ML model
  |
  v
JSON risk response

Lambda logs -> CloudWatch Logs
Dashboard -> AWS Amplify Hosting
Backend image -> Amazon ECR
```

## Architecture Strengths

| Strength | Why It Matters |
| --- | --- |
| Serverless backend | Avoids always-on compute for a portfolio ML API |
| Container image | Keeps backend dependencies packaged consistently |
| API Gateway boundary | Separates public HTTP routing from Lambda runtime |
| Amplify dashboard | Provides a deployed frontend without managing servers |
| CloudWatch logs | Gives visibility into backend behavior |
| Cost-control docs | Shows awareness of Free Tier and cleanup concerns |

## Architecture Tradeoffs

| Tradeoff | Explanation |
| --- | --- |
| Lambda cold starts | First request after inactivity may be slower |
| Public API Gateway URL | Good for demo, but production needs stronger abuse protection |
| Model packaged with backend | Simple for demo, but production may need model registry/versioning |
| Fast scan default | Safer and cheaper, but less context than content inspection |
| No IaC yet | Manual/cloud-console setup is proven, but Terraform/CDK would improve reproducibility |

## Good Interview Summary

> TrustNet is a serverless phishing URL detection platform. The backend is packaged as a Lambda container stored in ECR, exposed through API Gateway, monitored with CloudWatch, and connected to an Amplify-hosted dashboard plus Chrome extension workflow. The design is Free Tier-conscious and documented with model, security, and deployment proof.
