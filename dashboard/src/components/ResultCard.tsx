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

function formatScore(value: number | null | undefined) {
  return typeof value === "number" ? `${value}%` : "--";
}

function formatDeepStatus(value: string | undefined) {
  return value ? value.replace(/_/g, " ") : "Not reported";
}

export function ResultCard({ result, loading, healthState }: ResultCardProps) {
  const tone = getRiskTone(result?.status);
  const score = result?.riskScore ?? 0;
  const ringStyle = { "--risk": score } as CSSProperties;
  const statusLabel = result?.status ?? (healthState === "offline" ? "Demo state" : "Ready");
  const reasons = result?.reasons ?? [];
  const deepScan = result?.scanMode === "deep" ? result.deepScan : null;
  const deepSignals = Array.isArray(deepScan?.signals) ? deepScan.signals.length : 0;

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
        <span className="result-mode">{result?.scanMode ? `${result.scanMode} scan` : "ML prediction"}</span>
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
          <dt>Confidence</dt>
          <dd>{loading ? "Pending" : result?.confidence ?? "Not reported"}</dd>
        </div>
        <div>
          <dt>Model score</dt>
          <dd>{loading ? "Pending" : formatScore(result?.modelScore)}</dd>
        </div>
        <div>
          <dt>Signal score</dt>
          <dd>{loading ? "Pending" : formatScore(result?.heuristicScore)}</dd>
        </div>
        <div>
          <dt>Model version</dt>
          <dd>{loading ? "Pending" : result?.modelVersion ?? "Not reported"}</dd>
        </div>
        <div>
          <dt>Feature count</dt>
          <dd>{loading ? "Pending" : result?.featureCount ?? "Not reported"}</dd>
        </div>
        <div className="url-detail">
          <dt>Scanned URL</dt>
          <dd>{loading ? "Preparing request" : result?.url ?? "No URL scanned yet"}</dd>
        </div>
      </dl>

      {result?.finalUrl && result.finalUrl !== result.url && (
        <div className="final-url">
          <span>Final URL</span>
          <code>{result.finalUrl}</code>
        </div>
      )}

      {deepScan && (
        <div className="deep-scan-panel">
          <div className="reason-heading">
            <span>Deep inspection</span>
            <strong>{formatDeepStatus(deepScan.status)}</strong>
          </div>
          <dl>
            <div>
              <dt>HTTP status</dt>
              <dd>{deepScan.http_status ?? "Not reported"}</dd>
            </div>
            <div>
              <dt>Extra signals</dt>
              <dd>{deepSignals}</dd>
            </div>
            <div>
              <dt>Score adjustment</dt>
              <dd>{deepScan.score_adjustment ?? 0}</dd>
            </div>
          </dl>
          {deepScan.reason && <p>{deepScan.reason}</p>}
        </div>
      )}

      <div className="reason-panel">
        <div className="reason-heading">
          <span>Risk reasons</span>
          <strong>{loading ? "Scanning" : reasons.length ? `${reasons.length} found` : "None found"}</strong>
        </div>
        {loading ? (
          <div className="reason-empty">Collecting evidence from the API.</div>
        ) : reasons.length ? (
          <ul className="reason-list">
            {reasons.slice(0, 5).map((reason, index) => (
              <li key={`${reason.code ?? reason.label ?? "reason"}-${index}`} className={`severity-${reason.severity ?? "low"}`}>
                <span>{reason.label ?? "Risk signal"}</span>
                <p>{reason.detail ?? "The detector flagged this URL signal."}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="reason-empty">No strong phishing indicators were returned.</div>
        )}
      </div>
    </section>
  );
}
