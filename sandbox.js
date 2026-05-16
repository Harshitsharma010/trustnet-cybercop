const DEFAULT_API_BASE_URL = "http://localhost:5000";

(function() {
  const params = new URLSearchParams(location.search);
  const url = params.get("url") || "";
  const input = document.getElementById("urlInput");
  const iframe = document.getElementById("sandframe");
  const goBtn = document.getElementById("goBtn");
  const openOriginal = document.getElementById("openOriginal");
  const note = document.getElementById("note");

  function setUrl(u) {
    input.value = u;
    iframe.src = u;
  }

  function isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  function normalizeUrl(value) {
    return value.match(/^https?:\/\//i) ? value : "https://" + value;
  }

  function openOriginalFallback(targetUrl) {
    console.log("Using fallback method to open:", targetUrl);
    const urlToOpen = targetUrl + (targetUrl.includes("?") ? "&" : "?") + "nosandbox=1";

    try {
      chrome.tabs.create({ url: urlToOpen });
    } catch (fallbackError) {
      console.error("Chrome tabs fallback failed:", fallbackError);
      try {
        window.open(urlToOpen, "_blank");
      } catch (windowOpenError) {
        console.error("Window.open also failed:", windowOpenError);
        alert("Failed to open URL. Please copy and paste the URL manually: " + targetUrl);
      }
    }
  }

  function sendMessageWithTimeout(message, callback, timeoutMs = 5000) {
    let responded = false;

    const timeout = setTimeout(() => {
      if (!responded) {
        responded = true;
        console.warn("Message timeout reached, using fallback");
        callback(null, "timeout");
      }
    }, timeoutMs);

    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (responded) return;

        clearTimeout(timeout);
        responded = true;

        if (chrome.runtime.lastError) {
          console.error("Runtime error:", chrome.runtime.lastError.message);
          callback(null, chrome.runtime.lastError.message);
          return;
        }

        callback(response, null);
      });
    } catch (error) {
      if (responded) return;
      clearTimeout(timeout);
      responded = true;
      console.error("Failed to send message:", error);
      callback(null, error.message);
    }
  }

  function predictUrl(targetUrl) {
    chrome.storage.sync.get(
      { apiBaseUrl: DEFAULT_API_BASE_URL },
      ({ apiBaseUrl }) => {
        const apiUrl = `${String(apiBaseUrl).replace(/\/$/, "")}/predict`;

        fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ url: targetUrl })
        }).then(response => response.json()).then(data => {
          console.log("Phishing check result:", data);

          chrome.runtime.sendMessage({ action: "phishingResult", data: data });

          if (data.status === "Safe") {
            alert("URL is safe");
            openOriginalFallback(targetUrl);
          } else {
            alert("Potential phishing detected. Stay in sandbox.");
          }
        }).catch(error => {
          console.error("API error:", error);
        });
      },
    );
  }

  if (url) {
    setUrl(url);
    predictUrl(url);
    alert("Loading URL inside sandboxed iframe:\n" + url);
  } else {
    input.placeholder = "No URL provided";
  }

  goBtn.addEventListener("click", () => {
    try {
      const value = input.value.trim();
      if (value) {
        const normalized = normalizeUrl(value);
        if (isValidUrl(normalized)) {
          setUrl(normalized);
          predictUrl(normalized);
        } else {
          alert("Please enter a valid URL");
        }
      }
    } catch (error) {
      console.error("Go button error:", error);
    }
  });

  openOriginal.addEventListener("click", () => {
    if (!input.value) {
      alert("No URL to open");
      return;
    }

    const urlToOpen = normalizeUrl(input.value.trim());

    if (!isValidUrl(urlToOpen)) {
      alert("Invalid URL: " + urlToOpen);
      return;
    }

    openOriginal.disabled = true;
    openOriginal.textContent = "Opening...";

    sendMessageWithTimeout({
      action: "openOriginal",
      url: urlToOpen
    }, (response, error) => {
      openOriginal.disabled = false;
      openOriginal.textContent = "Open original";

      if (error) {
        console.error("Message sending failed:", error);
        openOriginalFallback(urlToOpen);
        return;
      }

      if (response && response.success) {
        console.log("Successfully opened original URL in tab:", response.tabId);
      } else {
        console.error("Background script returned error:", response);
        openOriginalFallback(urlToOpen);
      }
    });
  });

  iframe.addEventListener("load", () => {
    setTimeout(() => {
      try {
        iframe.contentDocument && iframe.contentDocument.title;
        note.textContent = "Site loaded inside sandboxed iframe.";
      } catch (error) {
        note.textContent = "Site may have blocked framing (X-Frame-Options/CSP). Opening original is an option.";
      }
    }, 500);
  });

  input.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      goBtn.click();
    }
  });
})();
