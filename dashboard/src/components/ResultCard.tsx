import type { CSSProperties } from "react";
import type { HealthState, ScanResult } from "../types";
import { getRecommendation, getRiskTone } from "../utils/risk";
import { Icon } from "./Icon";

type ResultCardProps = {
  result: ScanResult | null;
  loading: boolean;
  healthState: HealthState;
};

function formatResponseTime(value: number | null | undefined) {
  return typeof value === "number" ? `${value} ms` : "Not reported";
}

export function ResultCard({ result, loading, healthState }: ResultCardProps) {
  const tone = getRiskTone(result?.status);
  const score = result?.riskScore ?? 0;
  const ringStyle = { "--risk": score } as CSSProperties;
  const statusLabel = result?.status ?? (healthState === "offline" ? "Demo state" : "Ready");

  return (
    <section className={`result-card ${tone} ${loading ? "loading" : ""}`} aria-live="polite">
      <div className="result-topline">
        <span className={`status-badge ${tone}`}>
          {tone === "safe" && <Icon name="check" />}
          {tone === "warning" && <Icon name="alert" />}
          {tone === "danger" && <Icon name="alert" />}
          {tone === "neutral" && <Icon name="shield" />}
          {statusLabel}
        </span>
        <span className="result-mode">ML prediction</span>
      </div>

      <div className="risk-summary">
        <div className={`risk-ring ${tone}`} style={ringStyle}>
          <div>
            {loading ? (
              <span className="ring-skeleton" />
            ) : (
              <>
                <strong>{result?.riskScore === null || !result ? "--" : `${score}%`}</strong>
                <span>risk score</span>
              </>
            )}
          </div>
        </div>

        <div className="result-copy">
          <p className="eyebrow">Prediction result</p>
          <h2>{loading ? "Scanning URL..." : result ? `${result.status} verdict` : "No scan selected"}</h2>
          <p>
            {loading
              ? "Submitting the URL to the Flask API and waiting for the model response."
              : result
                ? getRecommendation(result.status)
                : healthState === "offline"
                  ? "The interface is ready, but the backend is not reachable yet."
                  : "Paste a URL or choose a quick scan to see the risk analysis here."}
          </p>
        </div>
      </div>

      <dl className="result-details">
        <div>
          <dt>Response time</dt>
          <dd>{loading ? "Scanning..." : formatResponseTime(result?.responseTimeMs)}</dd>
        </div>
        <div>
          <dt>Prediction value</dt>
          <dd>{loading ? "Pending" : result?.prediction ?? "Not reported"}</dd>
        </div>
        <div className="url-detail">
          <dt>Scanned URL</dt>
          <dd>{loading ? "Preparing request" : result?.url ?? "No URL scanned yet"}</dd>
        </div>
      </dl>
    </section>
  );
}
