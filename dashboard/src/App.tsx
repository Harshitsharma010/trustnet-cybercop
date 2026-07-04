import { useEffect, useMemo, useState } from "react";
import { ArchitectureStrip } from "./components/ArchitectureStrip";
import { Navbar } from "./components/Navbar";
import { ProofCards } from "./components/ProofCards";
import { RecentScansTimeline } from "./components/RecentScansTimeline";
import { ResultCard } from "./components/ResultCard";
import { UrlScanner } from "./components/UrlScanner";
import type { BackendModelInfo, BackendModelMetrics, HealthState, ScanResult } from "./types";
import { API_BASE_URL, HAS_CONFIGURED_API_BASE_URL, fetchHealth, fetchModelInfo, fetchModelMetrics, requestPrediction } from "./utils/api";
import { computeStats, loadScanHistory, prependScan, saveScanHistory } from "./utils/history";
import { createScanResult, validateAndNormalizeUrl } from "./utils/risk";

const DEMO_URL = "https://paypal-security-login.xyz/verify";

const DEMO_RESULTS: Record<string, Omit<ScanResult, "id" | "scannedAt">> = {
  "https://github.com": {
    url: "https://github.com",
    status: "Safe",
    riskScore: 8,
    modelScore: 8,
    heuristicScore: 12,
    prediction: "Safe",
    confidence: "High",
    modelVersion: "trustnet-url-intel-v2",
    scanMode: "fast",
    featureCount: 47,
    reasons: [
      { label: "Recognized trusted domain", severity: "low", detail: "The hostname matches a well-known software platform." },
      { label: "Clean URL structure", severity: "low", detail: "No credential keywords, suspicious encoding, or risky path patterns were found." },
    ],
    responseTimeMs: 91,
  },
  "https://paypal-security-login.xyz/verify": {
    url: "https://paypal-security-login.xyz/verify",
    status: "Dangerous",
    riskScore: 87,
    modelScore: 87,
    heuristicScore: 82,
    prediction: "Dangerous",
    confidence: "High",
    modelVersion: "trustnet-url-intel-v2",
    scanMode: "fast",
    featureCount: 47,
    reasons: [
      { label: "Suspicious brand keyword", severity: "high", detail: "The URL uses a payment brand name outside the official domain." },
      { label: "Login/verify path", severity: "high", detail: "Credential-oriented path terms increase phishing likelihood." },
      { label: "Risky TLD pattern", severity: "medium", detail: "The domain pattern is common in disposable phishing infrastructure." },
      { label: "Abnormal URL structure", severity: "medium", detail: "Hyphen-heavy host construction resembles impersonation campaigns." },
    ],
    responseTimeMs: 118,
  },
  "http://secure-login.verify-account.com/update/password": {
    url: "http://secure-login.verify-account.com/update/password",
    status: "Dangerous",
    riskScore: 91,
    modelScore: 89,
    heuristicScore: 94,
    prediction: "Dangerous",
    confidence: "High",
    modelVersion: "trustnet-url-intel-v2",
    scanMode: "fast",
    featureCount: 47,
    reasons: [
      { label: "Credential keyword cluster", severity: "critical", detail: "The host and path combine secure, login, account, update, and password terms." },
      { label: "Plain HTTP scheme", severity: "high", detail: "The URL does not use HTTPS for a credential-themed path." },
      { label: "Abnormal URL structure", severity: "medium", detail: "Multiple security words are chained together to imitate legitimacy." },
    ],
    responseTimeMs: 126,
  },
};

function createDemoResult(url: string, deepScan: boolean): ScanResult {
  const base = DEMO_RESULTS[url] ?? {
    ...DEMO_RESULTS[DEMO_URL],
    url,
  };

  return {
    ...base,
    id: `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    scanMode: deepScan ? "deep" : "fast",
    deepScan: deepScan
      ? {
          status: "redirects_checked",
          http_status: 200,
          score_adjustment: base.status === "Safe" ? 0 : 4,
          signals: base.reasons.slice(0, 2),
          reason: "Demo deep scan simulates redirect and response checks while the live API is unavailable.",
        }
      : null,
    scannedAt: new Date().toISOString(),
  };
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function runScanPipeline(onStep: (step: number) => void) {
  for (let step = 0; step < 4; step += 1) {
    onStep(step);
    await wait(230);
  }
}

function isNetworkError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return /failed to fetch|network|load failed|cors/i.test(message);
}

function App() {
  const [healthState, setHealthState] = useState<HealthState>("checking");
  const [healthDetail, setHealthDetail] = useState("Checking Flask API health.");
  const [urlInput, setUrlInput] = useState(DEMO_URL);
  const [scanError, setScanError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanStep, setScanStep] = useState(-1);
  const [deepScan, setDeepScan] = useState(false);
  const [result, setResult] = useState<ScanResult>(() => createDemoResult(DEMO_URL, false));
  const [history, setHistory] = useState<ScanResult[]>(() => loadScanHistory());
  const [modelInfo, setModelInfo] = useState<BackendModelInfo | null>(null);
  const [modelMetrics, setModelMetrics] = useState<BackendModelMetrics | null>(null);

  const stats = useMemo(() => computeStats(history), [history]);

  useEffect(() => {
    saveScanHistory(history);
  }, [history]);

  useEffect(() => {
    void checkHealth();
  }, []);

  async function checkHealth() {
    if (!HAS_CONFIGURED_API_BASE_URL) {
      setHealthState("offline");
      setHealthDetail("Live API unavailable. Showing demo analysis.");
      return;
    }

    setHealthState("checking");
    setHealthDetail("Checking Flask API health.");

    try {
      const health = await fetchHealth();
      const [info, metrics] = await Promise.all([fetchModelInfo(), fetchModelMetrics()]);
      const modelLoaded = health.model_loaded ?? health.modelLoaded;
      setModelInfo(info);
      setModelMetrics(metrics);
      setHealthState("healthy");
      setHealthDetail(modelLoaded === false ? "API reachable. Model status was not reported as loaded." : "API reachable and ready for scans.");
    } catch {
      setHealthState("offline");
      setHealthDetail("Live API unavailable. Showing demo analysis.");
    }
  }

  async function scanUrl(candidate: string, preferDemo = false) {
    const validation = validateAndNormalizeUrl(candidate);

    if (validation.ok === false) {
      setScanError(validation.message);
      return;
    }

    setUrlInput(validation.url);
    setScanError("");
    setLoading(true);
    setScanStep(0);

    try {
      await runScanPipeline(setScanStep);

      if (preferDemo || healthState !== "healthy") {
        const demoScan = createDemoResult(validation.url, deepScan);
        setResult(demoScan);
        setHistory((current) => prependScan(current, demoScan));
        return;
      }

      const payload = await requestPrediction(validation.url, deepScan);
      const scan = createScanResult(payload, validation.url);
      setResult(scan);
      setHistory((current) => prependScan(current, scan));
      setHealthState("healthy");
      setHealthDetail("API reachable and ready for scans.");
    } catch (error) {
      if (isNetworkError(error)) {
        const demoScan = createDemoResult(validation.url, deepScan);
        setResult(demoScan);
        setHistory((current) => prependScan(current, demoScan));
        setHealthState("offline");
        setHealthDetail("Live API unavailable. Showing demo analysis.");
      } else {
        setScanError(error instanceof Error ? error.message : "The scan failed. Please try again.");
      }
    } finally {
      setLoading(false);
      setScanStep(-1);
    }
  }

  function handleSubmit() {
    void scanUrl(urlInput);
  }

  function handleQuickScan(url: string) {
    setUrlInput(url);
    void scanUrl(url, true);
  }

  const apiStatusLabel = healthState === "healthy" ? "Live AWS API" : "Demo Mode";
  const apiStatusDetail = healthState === "healthy" ? "API reachable and ready for live scans." : "Live API unavailable, showing demo analysis.";

  return (
    <main className="app-shell">
      <Navbar healthState={healthState} healthDetail={healthDetail} onRefreshHealth={checkHealth} />

      <section className="ops-strip" aria-label="TrustNet operating status">
        <div>
          <span>API status</span>
          <strong>{apiStatusLabel}</strong>
          <small>{apiStatusDetail}</small>
        </div>
        <div>
          <span>Model</span>
          <strong>{modelInfo?.model_loaded || healthState !== "healthy" ? "trustnet-url-intel-v2" : "Loading"}</strong>
        </div>
        <div>
          <span>Signals</span>
          <strong>{modelMetrics?.feature_count ?? modelInfo?.feature_count ?? 47}</strong>
        </div>
        <div>
          <span>Session scans</span>
          <strong>{stats.urlsScanned}</strong>
        </div>
      </section>

      <div className="hero-grid">
        <UrlScanner
          value={urlInput}
          error={scanError}
          loading={loading}
          healthState={healthState}
          apiBaseUrl={API_BASE_URL}
          deepScan={deepScan}
          activeScanStep={scanStep}
          onChange={setUrlInput}
          onSubmit={handleSubmit}
          onQuickScan={handleQuickScan}
          onDeepScanChange={setDeepScan}
        />
        <ResultCard result={result} loading={loading} healthState={healthState} />
      </div>

      <ArchitectureStrip />
      <RecentScansTimeline />
      <ProofCards />
    </main>
  );
}

export default App;
