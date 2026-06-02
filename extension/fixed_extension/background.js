const DEFAULT_API_BASE_URL = "https://uen2ef1nt3.execute-api.ap-south-1.amazonaws.com";
const LOCAL_API_BASE_URLS = new Set([
  "http://127.0.0.1:5000",
  "http://localhost:5000"
]);
let latestScanData = null;

console.log("TrustNet CyberCop installed successfully");

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    statistics: {
      totalScans: 0,
      phishingDetected: 0,
      safeUrls: 0,
      suspiciousUrls: 0
    }
  });
});

chrome.omnibox.onInputEntered.addListener((text) => {
  const url = normalizeUrl(text);

  try {
    new URL(url);
    chrome.tabs.create({ url: buildSandboxUrl(url) });
  } catch (error) {
    console.error("Invalid sandbox URL:", text, error);
  }
});

function getApiBaseUrl(callback) {
  chrome.storage.sync.get(
    { apiBaseUrl: DEFAULT_API_BASE_URL },
    ({ apiBaseUrl }) => {
      const normalized = String(apiBaseUrl).replace(/\/$/, "");
      if (LOCAL_API_BASE_URLS.has(normalized)) {
        chrome.storage.sync.set({ apiBaseUrl: DEFAULT_API_BASE_URL });
        callback(DEFAULT_API_BASE_URL);
        return;
      }
      callback(normalized);
    },
  );
}

function recordScan(status) {
  chrome.storage.local.get({ statistics: {} }, ({ statistics }) => {
    const next = {
      totalScans: Number(statistics.totalScans || 0) + 1,
      phishingDetected: Number(statistics.phishingDetected || 0),
      safeUrls: Number(statistics.safeUrls || 0),
      suspiciousUrls: Number(statistics.suspiciousUrls || 0)
    };

    if (status === "Dangerous") next.phishingDetected += 1;
    if (status === "Safe") next.safeUrls += 1;
    if (status === "Suspicious") next.suspiciousUrls += 1;

    chrome.storage.local.set({ statistics: next });
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "scanUrl") {
    getApiBaseUrl((apiBaseUrl) => {
      fetch(`${apiBaseUrl}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: msg.url, deep_scan: false })
      })
        .then((response) => response.json())
        .then((data) => {
          latestScanData = data;
          recordScan(data.status);
          chrome.runtime.sendMessage({ action: "phishingResult", data });
          sendResponse(data);
        })
        .catch((error) => {
          sendResponse({ error: error.message || "API not reachable" });
        });
    });

    return true;
  }

  if (msg.action === "getLatestData") {
    sendResponse(latestScanData);
    return true;
  }

  if (msg.action === "openSandbox") {
    if (sender.tab?.id) {
      chrome.tabs.update(sender.tab.id, {
        url: buildSandboxUrl(msg.url)
      });
    } else {
      chrome.tabs.create({ url: buildSandboxUrl(msg.url) });
    }

    return true;
  }

  if (msg.action === "openOriginal") {
    chrome.tabs.create({ url: msg.url });
    return true;
  }
});

function buildSandboxUrl(url) {
  return chrome.runtime.getURL("sandbox.html") + "?url=" + encodeURIComponent(url);
}

function normalizeUrl(value) {
  const trimmed = String(value || "").trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : "https://" + trimmed;
}

