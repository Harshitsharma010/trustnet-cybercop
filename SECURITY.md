# Security Notes

TrustNet CyberCop is a portfolio and security education project. It demonstrates a deployed, Free Tier-conscious AWS security workflow, but it is not a production-grade phishing protection service.

## Deployed Security Posture

| Area | Current control |
| --- | --- |
| Frontend hosting | React dashboard is hosted on AWS Amplify. |
| Backend runtime | ML inference runs in an AWS Lambda container image. |
| Public API | API Gateway HTTP API exposes the Lambda routes. |
| Container artifact | Lambda image is stored in Amazon ECR. |
| Monitoring | CloudWatch Logs captures Lambda execution logs. |
| Log retention | CloudWatch log retention is set to 1 week. |
| API abuse control | API Gateway throttling is configured with rate limit 10 and burst limit 20. |
| Cost control | Backend compute is request-based through Lambda instead of always-on EC2/App Runner. |
| Browser workflow | Chrome extension calls the deployed API Gateway backend. |
| Fast scan safety | Default `/predict` path does not fetch remote webpages. |
| Deep scan safety | Optional deep scan skips private/local hosts and uses short timeouts. |

## Security Boundaries

TrustNet handles untrusted URLs submitted through the dashboard, API, or Chrome extension. The main security boundary is between user-controlled input and the AWS Lambda inference backend.

Primary trust assumptions:

- Submitted URLs are untrusted.
- The model artifact is built and deployed by the project maintainer.
- The public API Gateway URL is intentionally reachable for demo use.
- The dashboard and extension are demo clients, not authentication boundaries.
- No API keys, database credentials, or user secrets are required by the app.

## Input Validation

The backend validates URL input before inference:

- Rejects missing or empty URLs.
- Rejects URLs above the configured maximum length.
- Requires `http://` or `https://`.
- Rejects malformed HTTP/HTTPS URLs.
- Keeps the default fast scan URL-only to avoid unnecessary external network calls.
- Skips localhost and private hosts during deep scan to reduce SSRF risk.

## AWS Security Controls

The deployed AWS design intentionally uses a small service surface:

- AWS Lambda runs the ML inference container on demand.
- API Gateway HTTP API exposes only the required public routes.
- API Gateway throttling is configured with rate limit 10 and burst limit 20 to reduce abuse risk and protect Free Tier usage.
- Amazon ECR stores the backend image used by Lambda.
- CloudWatch Logs provides execution visibility.
- CloudWatch log retention is set to 1 week to reduce long-term log storage.
- AWS Amplify hosts the static React dashboard.
- GitHub Actions deployment uses OIDC to assume an AWS role instead of storing long-term AWS access keys.

Recommended IAM posture:

- Lambda execution role should use least privilege.
- The Lambda role should not include broad administrator permissions.
- The Lambda role should only need basic CloudWatch logging permissions unless future features require more.
- ECR push permissions should be limited to deployment workflows or the maintainer account.

## Public Endpoints

The deployed API Gateway backend currently supports:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Health and model load check |
| `POST` | `/predict` | Primary fast URL scan |
| `POST` | `/analyze` | Optional deep scan |
| `GET` | `/model/info` | Model metadata |
| `GET` | `/model/metrics` | Evaluation metrics |

Primary clients:

- AWS Amplify dashboard
- Chrome extension
- API clients such as curl or PowerShell

## Known Limitations

- This is not an enterprise phishing defense product.
- The public API Gateway URL is open for demo use.
- No user authentication is implemented.
- No WAF, CAPTCHA, or bot protection is currently configured.
- No API key is required for demo requests.
- The model primarily uses URL-derived features and does not inspect webpage content by default.
- Deep scan is optional to reduce cost, latency, and SSRF exposure.
- First request after inactivity may be slower because Lambda container cold starts can occur.

## Free Tier-Safe Hardening Backlog

These improvements are realistic to add without turning the project into a large paid infrastructure build.

| Priority | Improvement | Why it helps | Free Tier fit |
| --- | --- | --- | --- |
| P0 | Set `ALLOWED_ORIGINS` to the Amplify domain | Restricts browser CORS access to the deployed dashboard | Strong |
| P0 | Document Lambda IAM execution role permissions | Shows least-privilege cloud-security thinking | Strong |
| P1 | Add CloudWatch alarm for Lambda errors | Shows monitoring and incident awareness | Good |
| P1 | Add CloudWatch alarm for throttles or high duration | Catches abuse, cold starts, or model-load regressions | Good |
| P1 | Add a small architecture diagram to `docs/` | Helps recruiters understand the cloud flow quickly | Strong |
| P2 | Add Terraform or AWS CDK for the deployed stack | Shows infrastructure as code skill | Good, but time-box it |
| P2 | Add GitHub Actions deploy documentation | Shows release discipline without fully automating secrets | Strong |
| P3 | Add custom domain | Looks polished but is not essential for junior roles | Optional, may add cost |
| P3 | Add AWS WAF | Useful for production, but may add cost and scope | Not urgent |

## What To Avoid For This Portfolio Version

Avoid adding services that make the project expensive or harder to explain in interviews:

- RDS or DynamoDB unless persistent server-side scan history is truly needed.
- NAT Gateway because it can create steady cost.
- SageMaker or Bedrock for this version because the model already runs in Lambda.
- Always-on EC2 or App Runner as the primary backend path.
- Complex authentication unless the app gains user accounts.

## Security Interview Talking Points

Use these points when explaining the project:

- "I used Lambda and API Gateway to keep inference request-based instead of always-on."
- "I deployed the model as a Lambda container image stored in ECR."
- "I kept default scans URL-only to reduce latency, cost, and SSRF risk."
- "I configured CloudWatch Logs and limited retention to 1 week."
- "The next security hardening steps would be stricter CORS, route-specific throttling policies, IAM role documentation, and CloudWatch alarm tuning."

## Responsible Use

TrustNet CyberCop should be used as a learning and demonstration project. It can help explain URL risk signals, but users should not rely on it as the only defense against phishing, malware, credential theft, or fraud.
