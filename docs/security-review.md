# Security Review

This document summarizes TrustNet CyberCop's security posture for reviewers.

## Security Boundaries

| Boundary | Current Posture |
| --- | --- |
| API input | Validates missing, empty, long, and non-HTTP/HTTPS URL input |
| Fast scan | URL-only path avoids external fetches by default |
| Deep scan | Optional path with additional network behavior |
| CORS | Configurable through `ALLOWED_ORIGINS` |
| Logs | CloudWatch captures runtime behavior |
| Model | Reports metadata and metrics for transparency |
| Extension | Demonstrates browser workflow but is not a production security agent |

## Main Risks

| Risk | Mitigation Or Note |
| --- | --- |
| API abuse | Add stronger rate limiting, WAF, API keys, or usage plans for production |
| SSRF during deep scan | Keep deep scan opt-in and block private/local hosts |
| Overtrusting model output | Present verdict as risk signal, not absolute truth |
| CORS too open | Restrict `ALLOWED_ORIGINS` in deployed environments |
| Sensitive logging | Avoid logging full sensitive URLs in production |
| Dataset drift | Retrain and validate with newer phishing data |

## Why This Is A Good Portfolio Security Project

TrustNet demonstrates security thinking beyond code:

- It names limitations.
- It separates fast and deep scan behavior.
- It documents model metrics.
- It uses CloudWatch monitoring.
- It includes AWS deployment proof.
- It includes a hardening backlog.

## Production Hardening Backlog

- Add API Gateway usage plan or WAF rules.
- Restrict CORS to the deployed dashboard domain.
- Add request size limits and stricter validation.
- Add structured logs with sensitive URL redaction.
- Add alerting for error spikes and unusual traffic.
- Add Terraform or CDK for repeatable infrastructure.
- Add model drift monitoring and retraining process.
