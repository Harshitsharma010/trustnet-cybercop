const API = "http://127.0.0.1:5000/predict";

window.addEventListener("DOMContentLoaded", () => {

  const params = new URLSearchParams(location.search);
  let url = params.get("url");

  const input = document.getElementById("urlInput");
  const iframe = document.getElementById("sandframe");
  const note = document.getElementById("note");
  const goBtn = document.getElementById("goBtn");
  const openBtn = document.getElementById("openOriginal");

  function normalize(u) {
    if (!u) return "";
    return u.startsWith("http") ? u : "http://" + u;
  }

  function load(u) {
    u = normalize(u);
    url = u;
    input.value = u;
    iframe.src = u;
    scan(u);
  }

  function scan(u) {
    note.textContent = "Scanning...";

    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: u })
    })
    .then(r => r.json())
    .then(d => {
      if (d.status === "Dangerous") {
        alert("🚨 Dangerous phishing site!");
        note.textContent = "🚨 Dangerous";
      } else if (d.status === "Suspicious") {
        alert("⚠ Suspicious site!");
        note.textContent = "⚠ Suspicious";
      } else {
        note.textContent = "✅ Safe";
      }
    })
    .catch(err => {
      console.error(err);
      note.textContent = "Backend not reachable";
    });
  }

  goBtn.onclick = () => {
    if (input.value.trim()) load(input.value.trim());
  };

  openBtn.onclick = () => {
    chrome.runtime.sendMessage({
      action: "openOriginal",
      url
    });
  };

  if (url) load(url);
});
