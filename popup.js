function updateStatus(data) {
	const container = document.getElementById("statusContainer");
	container.innerHTML = `
    <div class="status-card ${data.status === "Safe" ? "safe" : "danger"}">
      <h3>Status: ${data.status}</h3>
      <p>Reason: ${data.reason}</p>
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
