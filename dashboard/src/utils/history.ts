import type { DashboardStats, ScanResult } from "../types";

const STORAGE_KEY = "trustnet-cybercop.scan-history";
const MAX_HISTORY_ITEMS = 10;

function isScanResult(value: unknown): value is ScanResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ScanResult>;
  return typeof candidate.id === "string" && typeof candidate.url === "string" && typeof candidate.scannedAt === "string";
}

export function loadScanHistory(): ScanResult[] {
  if (typeof localStorage === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.filter(isScanResult).slice(0, MAX_HISTORY_ITEMS) : [];
  } catch {
    return [];
  }
}

export function saveScanHistory(history: ScanResult[]) {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS)));
}

export function prependScan(history: ScanResult[], result: ScanResult) {
  return [result, ...history].slice(0, MAX_HISTORY_ITEMS);
}

export function computeStats(history: ScanResult[]): DashboardStats {
  const responseTimes = history
    .map((item) => item.responseTimeMs)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  return {
    urlsScanned: history.length,
    safeResults: history.filter((item) => item.status === "Safe").length,
    threatsDetected: history.filter((item) => item.status === "Phishing").length,
    avgResponseTimeMs: responseTimes.length
      ? Math.round(responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length)
      : null,
  };
}
