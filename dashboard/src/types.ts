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
  final_url?: string;
  status?: string;
  verdict?: string;
  risk_score?: number | string | null;
  phishing_chance?: number | string | null;
  prediction?: number | string | null;
  confidence?: string | null;
  model_score?: number | string | null;
  heuristic_score?: number | string | null;
  model_version?: string | null;
  model_profile?: string | null;
  scan_mode?: string | null;
  deep_scan?: DeepScanResult | null;
  feature_count?: number | string | null;
  reasons?: RiskReason[];
  response_time_ms?: number | string | null;
  [key: string]: unknown;
};

export type DeepScanResult = {
  status?: string;
  reason?: string;
  final_url?: string;
  http_status?: number | string | null;
  score_adjustment?: number | string | null;
  signals?: RiskReason[];
};

export type RiskReason = {
  code?: string;
  label?: string;
  severity?: "info" | "low" | "medium" | "high" | "critical" | string;
  detail?: string;
  evidence?: string | number | null;
};

export type ScanResult = {
  id: string;
  url: string;
  finalUrl?: string;
  status: RiskStatus;
  riskScore: number | null;
  modelScore: number | null;
  heuristicScore: number | null;
  prediction: string;
  confidence: string;
  modelVersion?: string;
  modelProfile?: string;
  scanMode?: string;
  deepScan?: DeepScanResult | null;
  featureCount?: number | null;
  reasons: RiskReason[];
  responseTimeMs: number | null;
  scannedAt: string;
  rawStatus?: string;
};

export type DashboardStats = {
  urlsScanned: number;
  safeResults: number;
  threatsDetected: number;
  avgRiskScore: number | null;
  avgResponseTimeMs: number | null;
};

export type BackendModelInfo = {
  model_loaded?: boolean;
  model_version?: string;
  model_profile?: string;
  selected_model?: string;
  trained_at?: string;
  feature_count?: number;
  metrics_summary?: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1?: number;
    roc_auc?: number;
  };
  aws_free_tier_posture?: Record<string, string>;
  [key: string]: unknown;
};

export type BackendModelMetrics = {
  selected_model?: string;
  training_samples?: number;
  feature_count?: number;
  data_source?: string;
  selected_metrics?: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1?: number;
    roc_auc?: number;
  };
  top_features?: Array<{ feature: string; importance: number }>;
  notes?: string[];
  [key: string]: unknown;
};
