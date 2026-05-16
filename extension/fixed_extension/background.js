const DEFAULT_API_BASE_URL = "http://127.0.0.1:5000";
const bypassTabs = new Set();

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

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0 || !details.tabId) return;

  if (bypassTabs.has(details.tabId)) {
    bypassTabs.delete(details.tabId);
    return;
  }

  if (!shouldSandboxUrl(details.url)) return;

  chrome.tabs.update(details.tabId, {
    url: buildSandboxUrl(details.url)
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  bypassTabs.delete(tabId);
});

function getApiBaseUrl(callback) {
  chrome.storage.sync.get(
    { apiBaseUrl: DEFAULT_API_BASE_URL },
    ({ apiBaseUrl }) => callback(String(apiBaseUrl).replace(/\/$/, "")),
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
        body: JSON.stringify({ url: msg.url })
      })
        .then((response) => response.json())
        .then((data) => {
          recordScan(data.status);
          sendResponse(data);
        })
        .catch((error) => {
          sendResponse({ error: error.message || "API not reachable" });
        });
    });

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
    chrome.tabs.create({ url: msg.url }, (tab) => {
      if (tab?.id) bypassTabs.add(tab.id);
    });
    return true;
  }
});

function buildSandboxUrl(url) {
  return chrome.runtime.getURL("sandbox.html") + "?url=" + encodeURIComponent(url);
}

function shouldSandboxUrl(url) {
  try {
    const parsed = new URL(url);

    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") return false;
    if (parsed.protocol === "chrome-extension:") return false;
    if (parsed.searchParams.has("nosandbox")) return false;

    return true;
  } catch {
    return false;
  }
}
