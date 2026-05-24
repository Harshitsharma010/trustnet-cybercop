import type { FormEvent } from "react";
import type { HealthState } from "../types";
import { Icon } from "./Icon";

const QUICK_SCAN_URLS = ["https://github.com", "http://secure-login.verify-account.com/update/password", "https://paypal-security-login.xyz/verify"];

type UrlScannerProps = {
  value: string;
  error: string;
  loading: boolean;
  healthState: HealthState;
  apiBaseUrl: string;
  deepScan: boolean;
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
  apiBaseUrl,
  deepScan,
  onChange,
  onSubmit,
  onQuickScan,
  onDeepScanChange,
}: UrlScannerProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <section className="scanner-shell" aria-labelledby="scanner-heading">
      <div className="hero-copy">
        <p className="eyebrow">Real-time URL intelligence</p>
        <h1 id="scanner-heading">Analyze suspicious URLs before you click</h1>
        <p>
          TrustNet CyberCop combines lightweight ML inference with explainable URL risk signals, optional deep analysis,
          local scan history, and AWS Free Tier conscious deployment paths.
        </p>
      </div>

      <div className="scan-panel">
        <form className="scan-form" onSubmit={handleSubmit}>
          <label htmlFor="url-input">URL analysis</label>
          <div className="scan-input-row">
            <span className="input-icon">
              <Icon name="search" />
            </span>
            <input
              id="url-input"
              type="text"
              value={value}
              placeholder="Paste a URL to scan..."
              onChange={(event) => onChange(event.target.value)}
              autoComplete="off"
              aria-invalid={Boolean(error)}
            />
            <button className="scan-button" type="submit" disabled={loading} aria-busy={loading}>
              {loading ? <span className="button-spinner" aria-hidden="true" /> : <Icon name="zap" />}
              {loading ? "Scanning" : "Scan URL"}
            </button>
          </div>
        </form>

        <div className="scan-mode" aria-label="Scan mode">
          <span>Scan mode</span>
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
          {QUICK_SCAN_URLS.map((url) => (
            <button key={url} type="button" onClick={() => onQuickScan(url)} disabled={loading}>
              {url}
            </button>
          ))}
        </div>

        {healthState === "offline" && (
          <div className="offline-note" role="status">
            <Icon name="alert" />
            <span>
              Backend is offline. The dashboard remains available; start the Flask API or set
              {" "}
              <code>VITE_API_BASE_URL</code>
              {" "}
              to scan live URLs.
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
          <code>{apiBaseUrl}</code>
        </div>
      </div>
    </section>
  );
}
