console.log("✅ TrustNet CyberCop installed successfully");

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

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  if (msg.action === "openSandbox") {

    const sandboxUrl =
      chrome.runtime.getURL("sandbox.html") +
      "?url=" +
      encodeURIComponent(msg.url);

    chrome.tabs.update(sender.tab.id, {
      url: sandboxUrl
    });

    return true;
  }

  if (msg.action === "openOriginal") {
    chrome.tabs.create({ url: msg.url });
    return true;
  }
});
