import type { FormEvent } from "react";
import type { HealthState } from "../types";
import { Icon } from "./Icon";

const QUICK_SCAN_URLS = ["https://example.com", "http://secure-login.verify-account.com", "https://github.com"];

type UrlScannerProps = {
  value: string;
  error: string;
  loading: boolean;
  healthState: HealthState;
  apiBaseUrl: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onQuickScan: (url: string) => void;
};

export function UrlScanner({
  value,
  error,
  loading,
  healthState,
  apiBaseUrl,
  onChange,
  onSubmit,
  onQuickScan,
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
          TrustNet CyberCop checks URLs through a Flask ML API and turns the model response into a clear risk verdict,
          scan history, and deployment-ready dashboard state.
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
