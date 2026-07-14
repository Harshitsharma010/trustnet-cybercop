import type { FormEvent } from "react";
import type { HealthState } from "../types";
import { Icon } from "./Icon";

const QUICK_SCAN_URLS = [
  { label: "GitHub safe example", url: "https://github.com" },
  { label: "PayPal fake login", url: "https://paypal-security-login.xyz/verify" },
  { label: "Secure login fake", url: "http://secure-login.verify-account.com/update/password" },
] as const;

type UrlScannerProps = {
  value: string;
  error: string;
  loading: boolean;
  healthState: HealthState;
  deepScan: boolean;
  activeScanStep: number;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onQuickScan: (url: string) => void;
  onDeepScanChange: (value: boolean) => void;
};

export function UrlScanner({
  value,
  error,
  loading,
  healthState,
  deepScan,
  activeScanStep,
  onChange,
  onSubmit,
  onQuickScan,
  onDeepScanChange,
}: UrlScannerProps) {
  const apiTargetLabel = healthState === "healthy" ? "Live AWS API" : "Demo Mode";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <section className="scanner-shell" aria-labelledby="scanner-heading">
      <div className="hero-copy">
        <p className="kicker">URL Intelligence Console</p>
        <h1 id="scanner-heading">Inspect suspicious URLs with ML risk signals.</h1>
        <p>
          TrustNet checks URL structure, domain signals, suspicious patterns, and ML risk score through a deployed AWS
          API pipeline.
        </p>
        <div className="hero-evidence" aria-label="TrustNet capabilities">
          <span>47 URL features</span>
          <span>Explainable reasons</span>
          <span>AWS Lambda path</span>
        </div>
      </div>

      <div className="scan-panel">
        <div className="panel-heading">
          <div>
            <span>Analysis Target</span>
            <strong>URL Intelligence Console</strong>
          </div>
          <span className="panel-index">{deepScan ? "Deep" : "Fast"}</span>
        </div>

        <form className="scan-form" onSubmit={handleSubmit}>
          <label htmlFor="url-input">Suspicious URL</label>
          <div className="scan-input-row">
            <span className="input-icon">
              <Icon name="search" />
            </span>
            <input
              id="url-input"
              type="text"
              value={value}
              placeholder="Paste a URL to inspect..."
              onChange={(event) => onChange(event.target.value)}
              autoComplete="off"
              aria-invalid={Boolean(error)}
            />
            <button className="scan-button" type="submit" disabled={loading} aria-busy={loading}>
              {loading ? <span className="button-spinner" aria-hidden="true" /> : <Icon name="zap" />}
              {loading ? "Analyzing" : "Analyze URL"}
            </button>
          </div>
        </form>

        <div className="scan-mode" aria-label="Scan mode">
          <span>{deepScan ? "Deep mode checks redirect behavior and response hints." : "Fast mode scores URL-only signals for quick triage."}</span>
          <div className="segmented-control">
            <button type="button" className={!deepScan ? "active" : ""} onClick={() => onDeepScanChange(false)} disabled={loading}>
              Fast
            </button>
            <button type="button" className={deepScan ? "active" : ""} onClick={() => onDeepScanChange(true)} disabled={loading}>
              Deep
            </button>
          </div>
        </div>

        <div className="quick-scan" aria-label="Example quick scans">
          <span>Quick scan</span>
          {QUICK_SCAN_URLS.map((example) => (
            <button key={example.url} type="button" onClick={() => onQuickScan(example.url)} disabled={loading}>
              {example.label}
            </button>
          ))}
        </div>

        <div className={`scan-trace ${loading ? "active" : ""}`} aria-label="Scan trace">
          <div className="trace-line" />
          <ol>
            <li className={activeScanStep >= 0 ? "active" : ""}>Normalize URL</li>
            <li className={activeScanStep >= 1 ? "active" : ""}>Extract Signals</li>
            <li className={activeScanStep >= 2 ? "active" : ""}>Score Model</li>
            <li className={activeScanStep >= 3 ? "active" : ""}>Generate Verdict</li>
          </ol>
        </div>

        {healthState === "offline" && (
          <div className="offline-note demo-mode-note" role="status">
            <Icon name="shield" />
            <span>
              Live API unavailable, showing demo analysis.
            </span>
          </div>
        )}

        {error && (
          <div className="error-note" role="alert">
            <Icon name="alert" />
            <span>{error}</span>
          </div>
        )}

        <div className="api-target">
          <span>API target</span>
          <code>{apiTargetLabel}</code>
        </div>
      </div>
    </section>
  );
}
