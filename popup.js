let latestPhishingData = null;

function updateStatus(data) {
  latestPhishingData = data;
  const container = document.getElementById("statusContainer");
  const scoreValue = data.risk_score ?? data.phishing_chance;
  const score = typeof scoreValue === "number" ? `${scoreValue}%` : "Unknown";
  const reasons = Array.isArray(data.reasons)
    ? data.reasons.slice(0, 2).map((reason) => `<p>${reason.label || "Risk signal"}</p>`).join("")
    : "";

  container.innerHTML = `
    <div class="status-card ${data.status === "Safe" ? "safe" : "danger"}">
      <h3>Status: ${data.status}</h3>
      <p>Risk score: ${score}</p>
      <p>Confidence: ${data.confidence || "Unknown"}</p>
      ${reasons}
      <p class="url">${data.url || ""}</p>
    </div>
  `;
}

chrome.runtime.sendMessage({ action: "getLatestData" }, (data) => {
  if (data) updateStatus(data);
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "phishingResult") {
    updateStatus(message.data);
  }
});

document.getElementById("openOriginalBtn").addEventListener("click", () => {
  if (!latestPhishingData?.url) {
    return;
  }

  chrome.runtime.sendMessage({
    action: "openOriginal",
    url: latestPhishingData.url
  });
});
