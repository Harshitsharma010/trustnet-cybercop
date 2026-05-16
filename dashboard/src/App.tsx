import { FormEvent, useEffect, useMemo, useState } from "react";

type HealthResponse = {
  status: string;
  model_loaded: boolean;
};

type PredictionResponse = {
  url: string;
  status: "Safe" | "Suspicious" | "Dangerous";
  phishing_chance: number;
  prediction: number;
  response_time_ms: number;
};

type ApiState = "checking" | "online" | "offline";
type TabKey = "scanner" | "activity";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

const SAMPLE_URLS = [
  "https://example.com",
  "https://example.co",
  "https://secure-login-update.example.com",
  "http://192.168.0.1/account/verify",
  "https://paypal-verify-account.example.net/login",
];

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function applyDashboardRiskHeuristics(result: PredictionResponse): PredictionResponse {
  let score = result.phishing_chance;

  try {
    const parsed = new URL(result.url);
    const host = parsed.hostname.toLowerCase();
    const fullUrl = result.url.toLowerCase();

    const suspiciousKeywords = [
      "login",
      "verify",
      "account",
      "secure",
      "update",
      "password",
      "paypal",
      "bank",
      "signin",
      "confirm"
    ];

    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) score += 45;
    if (host.includes("-")) score += 20;
    if (host.split(".").length >= 4) score += 15;
    if (suspiciousKeywords.some((keyword) => fullUrl.includes(keyword))) score += 35;
    if (host.endsWith(".co") || host.endsWith(".xyz") || host.endsWith(".top")) score += 20;
    if (!host.includes(".")) score += 35;
    if (result.url.length > 75) score += 15;
  } catch {
    score = Math.max(score, 65);
  }

  score = Math.min(100, Math.round(score * 10) / 10);

  let status: PredictionResponse["status"] = "Safe";
  if (score >= 70) status = "Dangerous";
  else if (score >= 35) status = "Suspicious";

  return {
    ...result,
    phishing_chance: Math.max(result.phishing_chance, score),
    status,
  };
}

function App() {
  const [apiState, setApiState] = useState<ApiState>("checking");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [url, setUrl] = useState("https://example.com");
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [history, setHistory] = useState<PredictionResponse[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("scanner");

  useEffect(() => {
    checkHealth();
  }, []);

  const riskTone = useMemo(() => {
    if (!result) return "neutral";
    return result.status.toLowerCase();
  }, [result]);

  const stats = useMemo(() => {
    const total = history.length;
    const dangerous = history.filter((item) => item.status === "Dangerous").length;
    const suspicious = history.filter((item) => item.status === "Suspicious").length;
    const safe = history.filter((item) => item.status === "Safe").length;
    const average =
      total === 0
        ? 0
        : Math.round(history.reduce((sum, item) => sum + item.phishing_chance, 0) / total);

    return { total, dangerous, suspicious, safe, average };
  }, [history]);

  async function checkHealth() {
    setApiState("checking");

    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const data: HealthResponse = await response.json();
      setHealth(data);
      setApiState("online");
    } catch {
      setHealth(null);
      setApiState("offline");
    }
  }

  async function scanUrl(targetUrl = url) {
    const normalized = normalizeUrl(targetUrl);
    if (!normalized) return;

    setUrl(normalized);
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalized }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || "Prediction failed");
      }

      const adjustedData = applyDashboardRiskHeuristics(data);
      setResult(adjustedData);
      setHistory((current) => [adjustedData, ...current.filter((item) => item.url !== adjustedData.url)].slice(0, 8));
      setActiveTab("scanner");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    scanUrl();
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">T</div>
        <div>
          <p>TrustNet CyberCop</p>
          <strong>Threat scanning console</strong>
        </div>
        <button className={`status-button ${apiState}`} onClick={checkHealth} type="button">
          <span />
          {apiState === "checking" && "Checking"}
          {apiState === "online" && `Online${health?.model_loaded ? " + model" : ""}`}
          {apiState === "offline" && "Offline"}
        </button>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">Phishing intelligence</p>
          <h1>Scan URLs before they reach your browser.</h1>
          <p className="lede">
            Test the Flask model behind your extension, inspect risk scoring, and keep a short scan trail while you build the cloud version.
          </p>
        </div>
        <div className="hero-metrics" aria-label="Scan summary">
          <div>
            <strong>{stats.total}</strong>
            <span>Scans</span>
          </div>
          <div>
            <strong>{stats.average}%</strong>
            <span>Avg risk</span>
          </div>
          <div>
            <strong>{stats.dangerous + stats.suspicious}</strong>
            <span>Flagged</span>
          </div>
        </div>
      </section>

      <nav className="tabs" aria-label="Dashboard sections">
        <button className={activeTab === "scanner" ? "active" : ""} onClick={() => setActiveTab("scanner")} type="button">
          Scanner
        </button>
        <button className={activeTab === "activity" ? "active" : ""} onClick={() => setActiveTab("activity")} type="button">
          Activity
        </button>
      </nav>

      {activeTab === "scanner" ? (
        <section className="workspace">
          <div className="scan-panel">
            <form onSubmit={handleSubmit}>
              <label htmlFor="url">URL to inspect</label>
              <div className="input-row">
                <input
                  id="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://example.com"
                  type="text"
                  required
                />
                <button className="primary-action" type="submit" disabled={loading}>
                  {loading ? "Scanning" : "Scan now"}
                </button>
              </div>
            </form>

            <div className="samples" aria-label="Sample URLs">
              {SAMPLE_URLS.map((sample) => (
                <button key={sample} onClick={() => scanUrl(sample)} type="button">
                  {sample.replace(/^https?:\/\//, "")}
                </button>
              ))}
            </div>

            {error && <p className="error">{error}</p>}

            <div className={`result-panel ${riskTone}`}>
              <div className="risk-meter" style={{ "--risk": result?.phishing_chance ?? 0 } as React.CSSProperties}>
                <div>
                  <strong>{result ? `${result.phishing_chance}%` : "--"}</strong>
                  <span>risk score</span>
                </div>
              </div>

              <div className="result-copy">
                <p className="result-label">Model verdict</p>
                <h2>{result ? result.status : "Ready to scan"}</h2>
                <p>
                  {result
                    ? `Prediction completed in ${result.response_time_ms} ms with class ${result.prediction}.`
                    : "Choose a sample or enter a URL to run the phishing model."}
                </p>
                {result && <code>{result.url}</code>}
              </div>
            </div>
          </div>

          <aside className="side-panel">
            <div className="panel-section">
              <p className="result-label">API target</p>
              <strong>{API_BASE_URL}</strong>
              <span className="muted">Dashboard checks `/health` and submits scans to `/predict`.</span>
            </div>
            <div className="panel-section mini-grid">
              <div>
                <strong>{stats.safe}</strong>
                <span>Safe</span>
              </div>
              <div>
                <strong>{stats.suspicious}</strong>
                <span>Suspicious</span>
              </div>
              <div>
                <strong>{stats.dangerous}</strong>
                <span>Dangerous</span>
              </div>
            </div>
            <div className="panel-section">
              <p className="result-label">Quick actions</p>
              <button className="secondary-action" onClick={() => setHistory([])} type="button">
                Clear scan history
              </button>
            </div>
          </aside>
        </section>
      ) : (
        <section className="activity-panel">
          <div className="activity-header">
            <div>
              <p className="eyebrow">Recent scans</p>
              <h2>Session activity</h2>
            </div>
            <button className="secondary-action" onClick={() => setHistory([])} type="button">
              Clear
            </button>
          </div>

          {history.length === 0 ? (
            <p className="empty-state">No scans yet. Run a scan to populate this view.</p>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <button key={item.url} className={`history-item ${item.status.toLowerCase()}`} onClick={() => setResult(item)} type="button">
                  <span>{item.status}</span>
                  <strong>{item.phishing_chance}%</strong>
                  <p>{item.url}</p>
                </button>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default App;
