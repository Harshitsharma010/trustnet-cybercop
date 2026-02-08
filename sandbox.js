const LOCAL_URL = "http://localhost:5000/predict";



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

  function normalizeUrl(url) {
    return url.match(/^https?:\/\//i) ? url : "https://" + url;
  }

  function openOriginalFallback(url) {
    console.log('Using fallback method to open:', url);
    const urlToOpen = url + (url.includes('?') ? '&' : '?') + 'nosandbox=1';
    
    try {
      chrome.tabs.create({ url: urlToOpen });
    } catch (fallbackError) {
      console.error('Chrome tabs fallback failed:', fallbackError);
      // Last resort: try window.open
      try {
        window.open(urlToOpen, '_blank');
      } catch (windowOpenError) {
        console.error('Window.open also failed:', windowOpenError);
        alert('Failed to open URL. Please copy and paste the URL manually: ' + url);
      }
    }
  }

  // Improved message sending with timeout and better error handling
  function sendMessageWithTimeout(message, callback, timeoutMs = 5000) {
    let responded = false;
    
    const timeout = setTimeout(() => {
      if (!responded) {
        responded = true;
        console.warn('Message timeout reached, using fallback');
        callback(null, 'timeout');
      }
    }, timeoutMs);

    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (responded) return; // Already handled by timeout
        
        clearTimeout(timeout);
        responded = true;
        
        // Check for runtime errors first
        if (chrome.runtime.lastError) {
          console.error('Runtime error:', chrome.runtime.lastError.message);
          callback(null, chrome.runtime.lastError.message);
          return;
        }
        
        callback(response, null);
      });
    } catch (error) {
      if (responded) return;
      clearTimeout(timeout);
      responded = true;
      console.error('Failed to send message:', error);
      callback(null, error.message);
    }
  }

  if (url) {
    setUrl(url);
    fetch(LOCAL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: url })
    }).then(response => response.json()).then(data => {
      // Process the response
      console.log('Phishing check result:', data);
      
      chrome.runtime.sendMessage({ action: 'phishingResult', data: data });

      if (data.status === 'Safe') {
        alert('✅ URL is safe');
        openOriginalFallback(url);

      } else {
        alert('⚠️ Potential phishing detected Stay In Sandbox!');
      }
    }).catch(error => {
      console.error('API error:', error);
    }); 
    alert("Loading URL inside sandboxed iframe:\n" + url);
  } else {
    input.placeholder = "No URL provided";
  }

  goBtn.addEventListener("click", () => {
    try {
      const v = input.value.trim();
      if (v) {
        const normalized = normalizeUrl(v);
        if (isValidUrl(normalized)) {
          setUrl(normalized);
        } else {
          alert('Please enter a valid URL');
        }
      }
    } catch (e) { 
      console.error('Go button error:', e); 
    }
  });

  openOriginal.addEventListener("click", () => {
    if (!input.value) {
      alert('No URL to open');
      return;
    }

    const urlToOpen = normalizeUrl(input.value.trim());
    
    if (!isValidUrl(urlToOpen)) {
      alert('Invalid URL: ' + urlToOpen);
      return;
    }

    // Disable button temporarily to prevent double-clicks
    openOriginal.disabled = true;
    openOriginal.textContent = 'Opening...';

    // Send message with improved error handling
    sendMessageWithTimeout({
      action: 'openOriginal',
      url: urlToOpen
    }, (response, error) => {
      // Re-enable button
      openOriginal.disabled = false;
      openOriginal.textContent = 'Open original';

      if (error) {
        console.error('Message sending failed:', error);
        openOriginalFallback(urlToOpen);
        return;
      }

      if (response && response.success) {
        console.log('Successfully opened original URL in tab:', response.tabId);
      } else {
        console.error('Background script returned error:', response);
        openOriginalFallback(urlToOpen);
      }
    });
  });

  iframe.addEventListener("load", () => {
    setTimeout(() => {
      try {
        const t = iframe.contentDocument && iframe.contentDocument.title;
        note.textContent = "Site loaded inside sandboxed iframe.";
      } catch (e) {
        note.textContent = "Site may have blocked framing (X-Frame-Options/CSP). Opening original is an option.";
      }
    }, 500);
  });

  // Handle Enter key in URL input
  input.addEventListener("keypress", (e) => {
    if (e.key === 'Enter') {
      goBtn.click();
    }
  });
})();