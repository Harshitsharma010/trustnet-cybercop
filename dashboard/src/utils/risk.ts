import type { BackendPrediction, RiskStatus, RiskTone, ScanResult } from "../types";

const HTTP_PROTOCOLS = new Set(["http:", "https:"]);

export function validateAndNormalizeUrl(input: string): { ok: true; url: string } | { ok: false; message: string } {
  const trimmed = input.trim();

  if (!trimmed) {
    return { ok: false, message: "Paste a URL before starting a scan." };
  }

  const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);

    if (!HTTP_PROTOCOLS.has(parsed.protocol) || !parsed.hostname) {
      return { ok: false, message: "Enter a valid HTTP or HTTPS URL before scanning." };
    }

    if (!parsed.hostname.includes(".") && parsed.hostname !== "localhost") {
      return { ok: false, message: "Enter a complete domain, such as https://example.com." };
    }

    return { ok: true, url: candidate };
  } catch {
    return { ok: false, message: "Enter a valid URL, such as https://example.com." };
  }
}

export function normalizeRiskScore(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return null;
  }

  const scaled = numeric >= 0 && numeric <= 1 ? numeric * 100 : numeric;
  return Math.min(100, Math.max(0, Math.round(scaled)));
}

function normalizeResponseTime(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric * 10) / 10 : null;
}

function fallbackStatus(rawStatus: unknown, prediction: unknown): RiskStatus {
  const normalizedStatus = typeof rawStatus === "string" ? rawStatus.toLowerCase() : "";

  if (normalizedStatus.includes("phish") || normalizedStatus.includes("danger") || normalizedStatus.includes("malicious")) {
    return "Phishing";
  }

  if (normalizedStatus.includes("suspicious") || normalizedStatus.includes("warning")) {
    return "Suspicious";
  }

  if (normalizedStatus.includes("safe") || normalizedStatus.includes("clean")) {
    return "Safe";
  }

  return Number(prediction) === 1 ? "Phishing" : "Safe";
}

export function statusFromRisk(score: number | null, rawStatus?: unknown, prediction?: unknown): RiskStatus {
  if (score === null) {
    return fallbackStatus(rawStatus, prediction);
  }

  if (score <= 30) {
    return "Safe";
  }

  if (score <= 70) {
    return "Suspicious";
  }

  return "Phishing";
}

export function getRiskTone(status?: RiskStatus): RiskTone {
  if (status === "Safe") {
    return "safe";
  }

  if (status === "Suspicious") {
    return "warning";
  }

  if (status === "Phishing") {
    return "danger";
  }

  return "neutral";
}

export function getRecommendation(status?: RiskStatus) {
  if (status === "Safe") {
    return "No strong phishing indicators detected. Still verify the domain manually.";
  }

  if (status === "Suspicious" || status === "Phishing") {
    return "Avoid entering credentials or payment details. Verify the source before proceeding.";
  }

  return "Run a scan to receive a model-backed recommendation.";
}

export function createScanResult(payload: BackendPrediction, submittedUrl: string): ScanResult {
  const riskScore = normalizeRiskScore(payload.phishing_chance);
  const status = statusFromRisk(riskScore, payload.status, payload.prediction);
  const responseTimeMs = normalizeResponseTime(payload.response_time_ms);
  const prediction = payload.prediction === null || payload.prediction === undefined ? "Not reported" : String(payload.prediction);

  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    url: typeof payload.url === "string" && payload.url.trim() ? payload.url : submittedUrl,
    status,
    riskScore,
    prediction,
    responseTimeMs,
    scannedAt: new Date().toISOString(),
    rawStatus: payload.status,
  };
}
