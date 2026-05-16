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

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

function App() {
  const [apiState, setApiState] = useState<ApiState>("checking");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [url, setUrl] = useState("https://example.com");
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status}`);
        }
        return response.json();
      })
      .then((data: HealthResponse) => {
        setHealth(data);
        setApiState("online");
      })
      .catch(() => setApiState("offline"));
  }, []);

  const riskTone = useMemo(() => {
    if (!result) return "neutral";
    return result.status.toLowerCase();
  }, [result]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || "Prediction failed");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">TrustNet CyberCop</p>
          <h1>Phishing URL scanner</h1>
          <p className="lede">
            Check a URL against the trained RandomForest model running from the Flask API.
          </p>
        </div>
        <div className={`status-pill ${apiState}`}>
          <span />
          {apiState === "checking" && "Checking API"}
          {apiState === "online" && `API online${health?.model_loaded ? " with model" : ""}`}
          {apiState === "offline" && "API offline"}
        </div>
      </section>

      <section className="scanner">
        <form onSubmit={handleSubmit}>
          <label htmlFor="url">URL</label>
          <div className="input-row">
            <input
              id="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
              type="url"
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Scanning..." : "Scan"}
            </button>
          </div>
        </form>

        {error && <p className="error">{error}</p>}

        <div className={`result-panel ${riskTone}`}>
          {result ? (
            <>
              <div>
                <p className="result-label">Status</p>
                <h2>{result.status}</h2>
              </div>
              <div className="score">
                <strong>{result.phishing_chance}%</strong>
                <span>phishing chance</span>
              </div>
              <dl>
                <div>
                  <dt>URL</dt>
                  <dd>{result.url}</dd>
                </div>
                <div>
                  <dt>Response</dt>
                  <dd>{result.response_time_ms} ms</dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="empty-state">Enter a URL and run a scan.</p>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
