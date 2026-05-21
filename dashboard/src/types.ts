export type HealthState = "checking" | "healthy" | "offline";

export type RiskStatus = "Safe" | "Suspicious" | "Phishing";

export type RiskTone = "safe" | "warning" | "danger" | "neutral";

export type BackendHealth = {
  status?: string;
  model_loaded?: boolean;
  modelLoaded?: boolean;
  [key: string]: unknown;
};

export type BackendPrediction = {
  url?: string;
  status?: string;
  phishing_chance?: number | string | null;
  prediction?: number | string | null;
  response_time_ms?: number | string | null;
  [key: string]: unknown;
};

export type ScanResult = {
  id: string;
  url: string;
  status: RiskStatus;
  riskScore: number | null;
  prediction: string;
  responseTimeMs: number | null;
  scannedAt: string;
  rawStatus?: string;
};

export type DashboardStats = {
  urlsScanned: number;
  safeResults: number;
  threatsDetected: number;
  avgResponseTimeMs: number | null;
};
