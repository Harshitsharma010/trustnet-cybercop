import { useEffect, useMemo, useState } from "react";
import { ArchitectureSection } from "./components/ArchitectureSection";
import { HowItWorks } from "./components/HowItWorks";
import { ModelInsights } from "./components/ModelInsights";
import { Navbar } from "./components/Navbar";
import { ResultCard } from "./components/ResultCard";
import { ScanHistory } from "./components/ScanHistory";
import { StatCard } from "./components/StatCard";
import { UrlScanner } from "./components/UrlScanner";
import type { BackendModelInfo, BackendModelMetrics, HealthState, ScanResult } from "./types";
import { API_BASE_URL, fetchHealth, fetchModelInfo, fetchModelMetrics, requestPrediction } from "./utils/api";
import { computeStats, loadScanHistory, prependScan, saveScanHistory } from "./utils/history";
import { createScanResult, validateAndNormalizeUrl } from "./utils/risk";

function isNetworkError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return /failed to fetch|network|load failed|cors/i.test(message);
}

function App() {
  const [healthState, setHealthState] = useState<HealthState>("checking");
  const [healthDetail, setHealthDetail] = useState("Checking Flask API health.");
  const [urlInput, setUrlInput] = useState("");
  const [scanError, setScanError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deepScan, setDeepScan] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
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
      setHealthDetail("Backend is not reachable. Start Flask or update VITE_API_BASE_URL.");
    }
  }

  async function scanUrl(candidate: string) {
    const validation = validateAndNormalizeUrl(candidate);

    if (validation.ok === false) {
      setScanError(validation.message);
      return;
    }

    setUrlInput(validation.url);
    setScanError("");
    setLoading(true);

    try {
      const payload = await requestPrediction(validation.url, deepScan);
      const scan = createScanResult(payload, validation.url);
      setResult(scan);
      setHistory((current) => prependScan(current, scan));
      setHealthState("healthy");
      setHealthDetail("API reachable and ready for scans.");
    } catch (error) {
      if (isNetworkError(error)) {
        setHealthState("offline");
        setHealthDetail("Backend is not reachable. Start Flask or update VITE_API_BASE_URL.");
        setScanError("Backend is not reachable. Check VITE_API_BASE_URL or start the Flask API, then try again.");
      } else {
        setScanError(error instanceof Error ? error.message : "The scan failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit() {
    void scanUrl(urlInput);
  }

  function handleQuickScan(url: string) {
    setUrlInput(url);
    void scanUrl(url);
  }

  function clearHistory() {
    setHistory([]);
  }

  return (
    <main className="app-shell">
      <Navbar healthState={healthState} healthDetail={healthDetail} onRefreshHealth={checkHealth} />

      <div className="hero-grid">
        <UrlScanner
          value={urlInput}
          error={scanError}
          loading={loading}
          healthState={healthState}
          apiBaseUrl={API_BASE_URL}
          deepScan={deepScan}
          onChange={setUrlInput}
          onSubmit={handleSubmit}
          onQuickScan={handleQuickScan}
          onDeepScanChange={setDeepScan}
        />
        <ResultCard result={result} loading={loading} healthState={healthState} />
      </div>

      <section className="stats-grid" aria-label="Security intelligence summary">
        <StatCard icon="activity" label="URLs Scanned" value={String(stats.urlsScanned)} detail="Stored locally in this browser" tone="info" />
        <StatCard icon="check" label="Safe Results" value={String(stats.safeResults)} detail="Low-risk model verdicts" tone="safe" />
        <StatCard icon="alert" label="Threats Detected" value={String(stats.threatsDetected)} detail="High-risk phishing verdicts" tone="danger" />
        <StatCard
          icon="shield"
          label="Avg Risk Score"
          value={stats.avgRiskScore === null ? "--" : `${stats.avgRiskScore}%`}
          detail="Mean score for local session scans"
          tone="neutral"
        />
        <StatCard
          icon="clock"
          label="Avg Response Time"
          value={stats.avgResponseTimeMs === null ? "--" : `${stats.avgResponseTimeMs} ms`}
          detail="Based on reported API timings"
          tone="neutral"
        />
      </section>

      <ModelInsights healthState={healthState} modelInfo={modelInfo} modelMetrics={modelMetrics} />
      <ScanHistory history={history} selectedId={result?.id} onSelect={setResult} onClear={clearHistory} />
      <HowItWorks />
      <ArchitectureSection />
    </main>
  );
}

export default App;
