# AWS deployment

This repo is ready for a two-service AWS deployment:

1. Deploy the Flask API with AWS App Runner from the repository root.
2. Deploy the React dashboard with AWS Amplify Hosting from the `dashboard` app root.
3. Update the browser extension API base URL after the App Runner URL is available.

## Backend: AWS App Runner

Use the repository root as the App Runner source directory. App Runner will read `apprunner.yaml`, install `backend/requirements.txt`, and start:

```bash
gunicorn --chdir backend -w 2 -b 0.0.0.0:5000 api:app
```

The health endpoint is:

```text
https://your-app-runner-url.awsapprunner.com/health
```

The prediction endpoint is:

```text
https://your-app-runner-url.awsapprunner.com/predict
```

## Frontend: AWS Amplify Hosting

Deploy Amplify from the same GitHub repository and use the `dashboard` app root. The root `amplify.yml` builds the Vite app and publishes `dashboard/dist`.

Set this Amplify environment variable before building:

```text
VITE_API_URL=https://your-app-runner-url.awsapprunner.com
```

## Chrome extension API URL

The extension defaults to `http://localhost:5000`. After backend deployment, set the deployed URL in Chrome extension storage:

```js
chrome.storage.sync.set({
  apiBaseUrl: "https://your-app-runner-url.awsapprunner.com"
});
```

Run that from the extension service worker console while testing the unpacked extension.
