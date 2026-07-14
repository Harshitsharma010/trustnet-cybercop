import type { BackendHealth, BackendModelInfo, BackendModelMetrics, BackendPrediction } from "../types";

const configuredBaseUrl = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "").trim().replace(/\/+$/, "");

export const HAS_CONFIGURED_API_BASE_URL = configuredBaseUrl.length > 0;
export const API_BASE_URL = configuredBaseUrl;

async function parseJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("The API returned an unreadable response.");
  }
}

function errorFromPayload(payload: Record<string, unknown> | null, fallback: string) {
  if (!payload) {
    return fallback;
  }

  const possibleMessage = payload.error || payload.detail || payload.message;
  return typeof possibleMessage === "string" && possibleMessage.trim() ? possibleMessage : fallback;
}

export async function fetchHealth(): Promise<BackendHealth> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    headers: {
      Accept: "application/json",
    },
  });

  const payload = await parseJson<BackendHealth>(response);

  if (!response.ok) {
    throw new Error(errorFromPayload(payload, `Health check failed with status ${response.status}.`));
  }

  return payload ?? {};
}

export async function requestPrediction(url: string, deepScan = false): Promise<BackendPrediction> {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ url, deep_scan: deepScan }),
  });

  const payload = await parseJson<BackendPrediction>(response);

  if (!response.ok) {
    throw new Error(errorFromPayload(payload, `Prediction failed with status ${response.status}.`));
  }

  return payload ?? {};
}

export async function fetchModelInfo(): Promise<BackendModelInfo> {
  const response = await fetch(`${API_BASE_URL}/model/info`, {
    headers: {
      Accept: "application/json",
    },
  });

  const payload = await parseJson<BackendModelInfo>(response);

  if (!response.ok) {
    throw new Error(errorFromPayload(payload, `Model info failed with status ${response.status}.`));
  }

  return payload ?? {};
}

export async function fetchModelMetrics(): Promise<BackendModelMetrics> {
  const response = await fetch(`${API_BASE_URL}/model/metrics`, {
    headers: {
      Accept: "application/json",
    },
  });

  const payload = await parseJson<BackendModelMetrics>(response);

  if (!response.ok) {
    throw new Error(errorFromPayload(payload, `Model metrics failed with status ${response.status}.`));
  }

  return payload ?? {};
}
