let latestPhishingData = null;

function updateStatus(data) {
  latestPhishingData = data;
  const container = document.getElementById("statusContainer");
  const score = typeof data.phishing_chance === "number" ? `${data.phishing_chance}%` : "Unknown";

  container.innerHTML = `
    <div class="status-card ${data.status === "Safe" ? "safe" : "danger"}">
      <h3>Status: ${data.status}</h3>
      <p>Phishing chance: ${score}</p>
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
