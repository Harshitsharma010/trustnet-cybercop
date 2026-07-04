import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ThreatCore } from "./ThreatCore";
import { URLSignalGraph } from "./URLSignalGraph";
import type { HealthState, ScanResult } from "../types";
import { getRecommendation, getRiskTone } from "../utils/risk";
import { Icon } from "./Icon";

type ResultCardProps = {
  result: ScanResult | null;
  loading: boolean;
  healthState: HealthState;
};

function formatResponseTime(value: number | null | undefined) {
  return typeof value === "number" ? `${value} ms` : "Demo";
}

function formatSignalScore(value: number | null | undefined) {
  return typeof value === "number" ? `${value}%` : "--";
}

function formatModelScore(value: number | null | undefined) {
  return typeof value === "number" ? (value / 100).toFixed(2) : "--";
}

function formatDeepStatus(value: string | undefined) {
  return value ? value.replace(/_/g, " ") : "Checked";
}

function getVerdictSummary(status: string | undefined) {
  if (status === "Dangerous") {
    return "High-risk phishing pattern detected";
  }

  if (status === "Suspicious") {
    return "Suspicious URL pattern needs review";
  }

  if (status === "Safe") {
    return "Low-risk URL pattern detected";
  }

  return "URL risk pattern ready for review";
}

export function ResultCard({ result, loading, healthState }: ResultCardProps) {
  const [whyOpen, setWhyOpen] = useState(false);
  const tone = getRiskTone(result?.status);
  const score = result?.riskScore ?? 0;
  const statusLabel = result?.status ?? (healthState === "healthy" ? "Ready" : "Demo Mode");
  const reasons = result?.reasons ?? [];
  const deepScan = result?.scanMode === "deep" ? result.deepScan : null;
  const deepSignals = Array.isArray(deepScan?.signals) ? deepScan.signals.length : 0;

  return (
    <motion.section
      className={`result-card ${tone} ${loading ? "loading" : ""}`}
      aria-live="polite"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="result-topline">
        <div>
          <p className="kicker">Risk Analysis</p>
          <h2>Signal Breakdown</h2>
        </div>
        <span className={`status-badge ${tone}`}>
          {tone === "safe" && <Icon name="check" />}
          {tone === "warning" && <Icon name="alert" />}
          {tone === "danger" && <Icon name="alert" />}
          {tone === "neutral" && <Icon name="shield" />}
          {statusLabel}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${result?.id ?? "demo"}-${loading ? "loading" : "ready"}`}
          className="risk-summary"
          initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="risk-readout">
            <ThreatCore tone={tone} loading={loading} />
            <motion.div
              className={`risk-ring ${tone}`}
              initial={{ "--risk": 0 } as any}
              animate={{ "--risk": score } as any}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            >
              <div>
                {loading ? (
                  <span className="ring-skeleton" />
                ) : (
                  <>
                    <strong>{`${score}%`}</strong>
                    <span>risk score</span>
                  </>
                )}
              </div>
            </motion.div>
            <div className="risk-scale" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="result-copy">
            <p className="result-mode">{result?.scanMode ? `${result.scanMode} scan` : "ML prediction"}</p>
            <h3>{loading ? "Analyzing URL..." : statusLabel}</h3>
            {!loading && <strong className="verdict-summary">{getVerdictSummary(result?.status)}</strong>}
            <p>
              {loading
                ? "Checking structure, domain terms, suspicious paths, and model risk score."
                : result
                  ? getRecommendation(result.status)
                  : healthState === "healthy"
                    ? "Choose a quick scan or inspect a pasted URL."
                    : "Live API unavailable, showing demo analysis."}
            </p>
            <div className="verdict-actions" aria-label="Verdict cues">
              <span className={tone === "danger" ? "danger" : ""}>Credential risk</span>
              <span className={tone === "warning" ? "warning" : ""}>URL structure</span>
              <span className={tone === "safe" ? "safe" : ""}>Domain signal</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <dl className="result-details">
        <div>
          <dt>Prediction</dt>
          <dd>{loading ? "Analyzing" : result?.prediction ?? statusLabel}</dd>
        </div>
        <div>
          <dt>Confidence</dt>
          <dd>{loading ? "Analyzing" : result?.confidence ?? "High"}</dd>
        </div>
        <div>
          <dt>Model score</dt>
          <dd>{loading ? "Analyzing" : formatModelScore(result?.modelScore)}</dd>
        </div>
        <div>
          <dt>Signal score</dt>
          <dd>{loading ? "Analyzing" : formatSignalScore(result?.heuristicScore)}</dd>
        </div>
        <div>
          <dt>Feature count</dt>
          <dd>{loading ? "Analyzing" : result?.featureCount ?? 47}</dd>
        </div>
        <div>
          <dt>Response time</dt>
          <dd>{loading ? "Analyzing" : formatResponseTime(result?.responseTimeMs)}</dd>
        </div>
        <div className="url-detail">
          <dt>Scanned URL</dt>
          <dd>{loading ? "Preparing request" : result?.url ?? "Demo URL ready"}</dd>
        </div>
        <div className="url-detail">
          <dt>Model version</dt>
          <dd>{loading ? "Analyzing" : result?.modelVersion ?? "trustnet-url-intel-v2"}</dd>
        </div>
      </dl>

      <URLSignalGraph result={result} />

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
              <dd>{deepScan.http_status ?? "Checked"}</dd>
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
          <span>Signal Breakdown</span>
          <strong>{loading ? "Scanning" : reasons.length ? `${reasons.length} signals` : "No signals"}</strong>
        </div>
        {loading ? (
          <div className="reason-empty">Collecting evidence from URL structure and model features.</div>
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

      <div className="why-drawer-shell">
        <button className="why-toggle" type="button" onClick={() => setWhyOpen((open) => !open)} aria-expanded={whyOpen}>
          Why this verdict?
        </button>
        <AnimatePresence initial={false}>
          {whyOpen && (
            <motion.div
              className="why-panel"
              initial={{ opacity: 0, height: 0, y: -4 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <p>
                TrustNet matched brand impersonation signals, login/verify path patterns, risky domain structure, and
                abnormal URL composition across 47 extracted URL features.
              </p>
              <dl className="signal-weight-list">
                <div>
                  <dt>Brand impersonation</dt>
                  <dd>High</dd>
                </div>
                <div>
                  <dt>Login/verify path</dt>
                  <dd>High</dd>
                </div>
                <div>
                  <dt>Risky TLD pattern</dt>
                  <dd>Medium</dd>
                </div>
                <div>
                  <dt>Abnormal URL structure</dt>
                  <dd>Medium</dd>
                </div>
              </dl>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <details className="api-drawer">
        <summary>View sample API response</summary>
        <pre>{`{
  prediction: ${result?.prediction ?? statusLabel},
  risk_score: ${result?.riskScore ?? 87},
  confidence: ${result?.confidence ?? "High"},
  feature_count: ${result?.featureCount ?? 47},
  model_version: ${result?.modelVersion ?? "trustnet-url-intel-v2"},
  reasons: ${reasons.map((reason) => reason.label).join(", ") || "Suspicious brand keyword, Login/verify path, Risky TLD pattern, Abnormal URL structure"}
}`}</pre>
      </details>
    </motion.section>
  );
}
