const DEFAULT_API_BASE_URL = "http://127.0.0.1:5000";

window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(location.search);
  let url = params.get("url");

  const input = document.getElementById("urlInput");
  const iframe = document.getElementById("sandframe");
  const note = document.getElementById("note");
  const goBtn = document.getElementById("goBtn");
  const openBtn = document.getElementById("openOriginal");

  function normalize(value) {
    if (!value) return "";
    return /^https?:\/\//i.test(value) ? value : "https://" + value;
  }

  function setNote(message, color) {
    note.textContent = message;
    note.style.color = color;
  }

  function getApiBaseUrl(callback) {
    chrome.storage.sync.get(
      { apiBaseUrl: DEFAULT_API_BASE_URL },
      ({ apiBaseUrl }) => callback(String(apiBaseUrl).replace(/\/$/, "")),
    );
  }

  function load(value) {
    const normalized = normalize(value);
    url = normalized;
    input.value = normalized;
    iframe.src = normalized;
    scan(normalized);
  }

  function scan(value) {
    setNote("Scanning URL...", "#fbbf24");

    getApiBaseUrl((apiBaseUrl) => {
      fetch(`${apiBaseUrl}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value })
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`API Error: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          console.log("Scan result:", data);

          if (data.status === "Dangerous") {
            showWarning("DANGEROUS - phishing detected", data);
            setNote(`Dangerous (${data.risk_score ?? data.phishing_chance}%)`, "#dc2626");
          } else if (data.status === "Suspicious") {
            showWarning("SUSPICIOUS - exercise caution", data);
            setNote(`Suspicious (${data.risk_score ?? data.phishing_chance}%)`, "#f59e0b");
          } else {
            setNote(`Safe (${data.risk_score ?? data.phishing_chance}%)`, "#10b981");
          }
        })
        .catch((err) => {
          console.error("Scan error:", err);
          setNote("Backend not reachable", "#dc2626");
          showError(`Cannot connect to TrustNet API at ${apiBaseUrl}`);
        });
    });
  }

  function showWarning(title, data) {
    const reasons = Array.isArray(data.reasons)
      ? data.reasons.slice(0, 3).map((reason) => `- ${reason.label || "Risk signal"}`).join("\n")
      : "No detailed reasons returned.";
    const message =
      `${title}\n\n` +
      `URL: ${data.url}\n` +
      `Risk Score: ${data.risk_score ?? data.phishing_chance}%\n` +
      `Confidence: ${data.confidence || "Unknown"}\n\n` +
      `${reasons}\n\n` +
      "Do not enter passwords or personal information on risky sites.";

    alert(message);
  }

  function showError(message) {
    alert(`Error\n\n${message}`);
  }

  goBtn.onclick = () => {
    const inputUrl = input.value.trim();
    if (inputUrl) {
      load(inputUrl);
    } else {
      alert("Please enter a URL");
    }
  };

  input.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      goBtn.click();
    }
  });

  openBtn.onclick = () => {
    if (!url) {
      alert("No URL loaded");
      return;
    }

    const confirmed = confirm(
      "Warning\n\n" +
      "You are about to open this site without sandbox protection.\n\n" +
      "Continue anyway?",
    );

    if (confirmed) {
      chrome.runtime.sendMessage({
        action: "openOriginal",
        url: url
      });
    }
  };

  iframe.addEventListener("error", () => {
    console.log("Iframe failed to load");
  });

  if (url) {
    load(url);
  } else {
    setNote("Enter a URL to scan", "#6b7280");
  }
});
