// sandbox.js - Fixed with proper encoding and error handling

const API = "http://127.0.0.1:5000/predict";

window.addEventListener("DOMContentLoaded", () => {

  const params = new URLSearchParams(location.search);
  let url = params.get("url");

  const input = document.getElementById("urlInput");
  const iframe = document.getElementById("sandframe");
  const note = document.getElementById("note");
  const goBtn = document.getElementById("goBtn");
  const openBtn = document.getElementById("openOriginal");

  // Normalize URL (add http if missing)
  function normalize(u) {
    if (!u) return "";
    return u.startsWith("http") ? u : "http://" + u;
  }

  // Load URL in iframe and scan
  function load(u) {
    u = normalize(u);
    url = u;
    input.value = u;
    iframe.src = u;
    scan(u);
  }

  // Scan URL with API
  function scan(u) {
    note.textContent = "🔍 Scanning URL...";
    note.style.color = "#fbbf24";

    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: u })
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`API Error: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log("Scan result:", data);
        
        if (data.status === "Dangerous") {
          showWarning("🚨 DANGEROUS - Phishing Detected!", data);
          note.textContent = `🚨 DANGEROUS (${data.phishing_chance}%)`;
          note.style.color = "#dc2626";
        }
        else if (data.status === "Suspicious") {
          showWarning("⚠️ SUSPICIOUS - Exercise Caution", data);
          note.textContent = `⚠️ Suspicious (${data.phishing_chance}%)`;
          note.style.color = "#f59e0b";
        }
        else {
          note.textContent = `✅ Safe (${data.phishing_chance}%)`;
          note.style.color = "#10b981";
        }
      })
      .catch(err => {
        console.error("Scan error:", err);
        note.textContent = "❌ Backend not reachable";
        note.style.color = "#dc2626";
        
        showError(
          "Cannot connect to TrustNet API. " +
          "Make sure the Flask backend is running on http://127.0.0.1:5000"
        );
      });
  }

  // Show warning dialog
  function showWarning(title, data) {
    const message = 
      `${title}\n\n` +
      `URL: ${data.url}\n` +
      `Phishing Probability: ${data.phishing_chance}%\n` +
      `Reason: ${data.reason}\n\n` +
      `⚠️ DO NOT enter passwords or personal information!`;
    
    alert(message);
  }

  // Show error dialog
  function showError(message) {
    alert(`❌ Error\n\n${message}`);
  }

  // Go button - load URL from input
  goBtn.onclick = () => {
    const inputUrl = input.value.trim();
    if (inputUrl) {
      load(inputUrl);
    } else {
      alert("Please enter a URL");
    }
  };

  // Enter key in input
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      goBtn.click();
    }
  });

  // Open original button - open in new tab
  openBtn.onclick = () => {
    if (!url) {
      alert("No URL loaded");
      return;
    }

    const confirmed = confirm(
      "⚠️ WARNING\n\n" +
      "You are about to open this site WITHOUT sandbox protection.\n\n" +
      "This may be dangerous if the site is malicious.\n\n" +
      "Continue anyway?"
    );

    if (confirmed) {
      chrome.runtime.sendMessage({
        action: "openOriginal",
        url: url
      });
    }
  };

  // Handle iframe load errors
  iframe.addEventListener('error', () => {
    console.log("Iframe failed to load");
  });

  // If URL provided in query params, load it
  if (url) {
    load(url);
  } else {
    note.textContent = "Enter a URL to scan";
    note.style.color = "#6b7280";
  }
});
