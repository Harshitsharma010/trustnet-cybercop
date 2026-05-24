function updateStatus(data) {
	const container = document.getElementById("statusContainer");
	const score = data.risk_score ?? data.phishing_chance ?? "Unknown";
	const reasons = Array.isArray(data.reasons)
		? data.reasons.slice(0, 2).map((reason) => `<p>${reason.label || "Risk signal"}</p>`).join("")
		: "";
	container.innerHTML = `
    <div class="status-card ${data.status === "Safe" ? "safe" : "danger"}">
      <h3>Status: ${data.status}</h3>
      <p>Risk score: ${score}%</p>
      <p>Confidence: ${data.confidence || "Unknown"}</p>
      ${reasons}
      <p class="url">${data.url}</p>
    </div>
  `;
}

// Ask background script for latest data when popup opens
chrome.runtime.sendMessage({ action: "getLatestData" }, (data) => {
	if (data) updateStatus(data);
});

// Listen to real-time updates while popup is open
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "phishingResult") {
		updateStatus(message.data);
	}
});

// Open original URL button
document.getElementById("openOriginalBtn").addEventListener("click", () => {
	chrome.runtime.sendMessage({ action: "openOriginal" });
});
