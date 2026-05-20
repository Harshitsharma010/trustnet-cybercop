import { FormEvent, useEffect, useMemo, useState } from "react";

type PredictionResponse = {
  url: string;
  status: "Safe" | "Suspicious" | "Dangerous";
  phishing_chance: number;
  prediction: number;
  response_time_ms: number;
};

type HealthResponse = {
  status: string;
  model_loaded: boolean;
};

type ApiState = "checking" | "online" | "offline";
type ViewKey = "overview" | "scanner" | "analytics" | "activity" | "about";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const SAMPLE_URLS = ["https://example.com", "https://secure-login-update.example.com", "http://192.168.0.1/account/verify", "https://paypal-verify-account.example.net/login"];
const NAV_ITEMS: Array<{ key: ViewKey; label: string; hint: string }> = [
  { key: "overview", label: "Overview", hint: "System Health" },
  { key: "scanner", label: "Phishing Guard", hint: "URL Safety" },
  { key: "analytics", label: "Threat Intel", hint: "Risk Patterns" },
  { key: "activity", label: "Activity Log", hint: "Recent Scans" },
  { key: "about", label: "Cloud Stack", hint: "Architecture" },
];

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

function isPredictionResponse(value: unknown): value is PredictionResponse {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<PredictionResponse>;

  return (
    typeof item.url === "string" &&
    typeof item.phishing_chance === "number" &&
    typeof item.prediction === "number" &&
    typeof item.response_time_ms === "number"
  );
}

function applyRisk(result: PredictionResponse): PredictionResponse {
  let score = result.phishing_chance;
  try {
    const parsed = new URL(result.url);
    const host = parsed.hostname.toLowerCase();
    const fullUrl = result.url.toLowerCase();
    const riskyWords = ["login", "verify", "account", "secure", "update", "password", "paypal", "bank", "signin"];
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) score += 45;
    if (host.includes("-")) score += 18;
    if (host.split(".").length >= 4) score += 15;
    if (riskyWords.some((word) => fullUrl.includes(word))) score += 30;
    if (result.url.length > 75) score += 12;
  } catch {
    score = Math.max(score, 65);
  }
  score = Math.min(100, Math.round(score));
  let status: PredictionResponse["status"] = "Safe";
  if (score >= 70) status = "Dangerous";
  else if (score >= 35) status = "Suspicious";
  return { ...result, phishing_chance: score, status };
}

function demoPrediction(url: string): PredictionResponse {
  const seed = url.length % 100;
  const score = Math.min(92, Math.max(18, seed + 22));
  return applyRisk({ url, status: "Safe", phishing_chance: score, prediction: score >= 70 ? 1 : 0, response_time_ms: 120 + (seed % 140) });
}

function RiskGauge({ value, status }: { value: number; status: PredictionResponse["status"] | "Ready" }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className={`risk-gauge ${status.toLowerCase()}`}>
      <svg viewBox="0 0 112 112" aria-label={`Risk score ${value}%`}>
        <circle cx="56" cy="56" r={radius} className="gauge-track" />
        <circle cx="56" cy="56" r={radius} className="gauge-fill" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div><strong>{value ? `${value}%` : "--"}</strong><span>Risk</span></div>
    </div>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState<ViewKey>("overview");
  const [apiState, setApiState] = useState<ApiState>("checking");
  const [url, setUrl] = useState("https://example.com");
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [history, setHistory] = useState<PredictionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { checkHealth(); }, []);

  const stats = useMemo(() => {
    const total = history.length;
    const safe = history.filter((item) => item.status === "Safe").length;
    const suspicious = history.filter((item) => item.status === "Suspicious").length;
    const dangerous = history.filter((item) => item.status === "Dangerous").length;
    const avgRisk = total ? Math.round(history.reduce((sum, item) => sum + item.phishing_chance, 0) / total) : 0;
    const avgLatency = total ? Math.round(history.reduce((sum, item) => sum + item.response_time_ms, 0) / total) : 0;
    return { total, safe, suspicious, dangerous, avgRisk, avgLatency };
  }, [history]);

  async function checkHealth() {
    setApiState("checking");
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/health`, {}, 3500);
      if (!response.ok) throw new Error("Health check failed");
      const data = (await response.json()) as HealthResponse;
      setApiState(data.model_loaded ? "online" : "offline");
    } catch {
      setApiState("offline");
    }
  }

  async function scan(targetUrl = url) {
    const normalized = normalizeUrl(targetUrl);
    if (!normalized) return;
    setUrl(normalized);
    setLoading(true);
    setError("");
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/predict`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: normalized }) }, 7000);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Prediction failed");
      if (!isPredictionResponse(data)) throw new Error("Invalid prediction response");
      const item = applyRisk(data);
      setResult(item);
      setHistory((current) => [item, ...current.filter((entry) => entry.url !== item.url)].slice(0, 30));
      setApiState("online");
    } catch {
      const item = demoPrediction(normalized);
      setResult(item);
      setHistory((current) => [item, ...current.filter((entry) => entry.url !== item.url)].slice(0, 30));
      setApiState("offline");
      setError("Backend offline. Showing demo inference.");
    } finally {
      setLoading(false);
      setActiveView("scanner");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    scan();
  }

  const currentRisk = result?.phishing_chance ?? stats.avgRisk;
  const currentStatus = result?.status ?? "Ready";

  return (
    <main className="app-frame">
      <aside className="sidebar">
        <div className="brand-block"><div className="brand-icon">T</div><div><strong>CYBERCOP</strong><span>TRUSTNET AI</span></div></div>
        <nav className="side-nav" aria-label="Dashboard views">
          {NAV_ITEMS.map((item) => <button key={item.key} className={activeView === item.key ? "active" : ""} onClick={() => setActiveView(item.key)} type="button"><span>{item.label}</span><small>{item.hint}</small></button>)}
        </nav>
        <div className="sim-card"><span>Simulation Mode</span><p>{apiState === "online" ? "Live API connected." : "Demo data active."}</p><button onClick={() => scan("https://secure-login-update.example.com")} type="button">Start Demo</button></div>
      </aside>

      <section className="workspace">
        <header className="topbar"><button className="menu-button" type="button" aria-label="Toggle menu"><span /><span /></button><div className="admin"><strong>Security Admin</strong><span>{apiState === "online" ? "Model Active" : "Demo Access"}</span></div><button className={`status-chip ${apiState}`} onClick={checkHealth} type="button"><span />{apiState}</button></header>

        {activeView === "overview" && <div className="view-grid overview-grid"><section className="mail-window"><div className="window-bar"><i /><i /><i /><span>Secure Mail Client v4.0</span></div><div className="email-card"><div className="email-head"><div><strong>Urgent: Verify Your Bank Account Now</strong><span>support@secure-bank-verify.com</span></div><small>Today, 10:42 AM</small></div><p>Dear Customer, we noticed suspicious activity. Click here to verify your account immediately.</p><button onClick={() => scan("https://secure-bank-verify.example.com/account/login")} type="button">Analyze Message Link</button></div></section><aside className="analysis-panel"><h1>Safety Analysis</h1><RiskGauge value={currentRisk} status={currentStatus} /><h2>{result ? result.status : "Ready"}</h2><div className="signal-row"><span>Sender Reputation</span><strong>Unknown</strong></div><div className="signal-row"><span>Link Analysis</span><strong>{currentRisk >= 35 ? "Suspicious" : "Clean"}</strong></div><div className="signal-row"><span>Urgency Triggers</span><strong>{currentRisk >= 35 ? "Detected" : "None"}</strong></div><button className="danger-action" onClick={() => setActiveView("scanner")} type="button">Open Scanner</button></aside></div>}

        {activeView === "scanner" && <div className="view-grid scanner-grid"><section className="tool-panel"><p className="view-label">Phishing Guard</p><h1>URL Threat Scanner</h1><form className="scan-form" onSubmit={handleSubmit}><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com" required /><button disabled={loading} type="submit">{loading ? "Analyzing" : "Analyze"}</button></form><div className="sample-list">{SAMPLE_URLS.map((sample) => <button key={sample} onClick={() => scan(sample)} type="button">{sample.replace(/^https?:\/\//, "")}</button>)}</div>{error && <p className="notice">{error}</p>}<div className="result-card"><div><span>Current verdict</span><strong>{result ? result.status : "Ready to scan"}</strong><p>{result ? `${result.response_time_ms} ms response, class ${result.prediction}` : "Submit a URL to run the model."}</p>{result && <code>{result.url}</code>}</div><RiskGauge value={result?.phishing_chance ?? 0} status={result?.status ?? "Ready"} /></div></section><aside className="summary-panel"><h2>Session Summary</h2><div className="mini-stats"><div><strong>{stats.safe}</strong><span>Safe</span></div><div><strong>{stats.suspicious}</strong><span>Suspicious</span></div><div><strong>{stats.dangerous}</strong><span>Dangerous</span></div></div></aside></div>}

        {activeView === "analytics" && <section className="tool-panel"><p className="view-label">Threat Intel</p><h1>Risk Distribution</h1>{[["Safe", stats.safe, "safe"], ["Suspicious", stats.suspicious, "warn"], ["Dangerous", stats.dangerous, "danger"]].map(([label, value, tone]) => { const width = stats.total ? Math.round((Number(value) / stats.total) * 100) : 0; return <div className="bar-row" key={String(label)}><span>{label}</span><div><i className={String(tone)} style={{ width: `${width}%` }} /></div><strong>{width}%</strong></div>; })}</section>}

        {activeView === "activity" && <section className="tool-panel"><p className="view-label">Recent Scans</p><h1>Activity Log</h1>{history.length === 0 ? <p className="empty">No scans yet. Run a sample from the scanner.</p> : <div className="history-list">{history.map((item) => <button key={item.url} onClick={() => { setResult(item); setActiveView("scanner"); }} type="button"><span className={item.status.toLowerCase()}>{item.status}</span><strong>{item.phishing_chance}%</strong><small>{item.url}</small></button>)}</div>}</section>}

        {activeView === "about" && <section className="tool-panel"><p className="view-label">Cloud Stack</p><h1>Lightweight AWS Ready Build</h1><div className="stack-grid"><div><strong>React + Vite</strong><span>Fast static frontend</span></div><div><strong>Flask API</strong><span>/health and /predict</span></div><div><strong>ML Model</strong><span>URL risk inference</span></div><div><strong>Free Tier Friendly</strong><span>No heavy chart or 3D packages</span></div></div></section>}
      </section>
    </main>
  );
}
