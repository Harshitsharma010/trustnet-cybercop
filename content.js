(function() {
  const TRUSTED_DOMAINS = [
    "google.com",
    "youtube.com",
    "github.com",
    "stackoverflow.com",
    "wikipedia.org",
    "microsoft.com",
    "apple.com",
    "amazon.com",
    "linkedin.com",
    "reddit.com"
  ];

  const SUSPICIOUS_PATTERNS = [
    /paypal.*verify/i,
    /amazon.*account.*suspend/i,
    /apple.*id.*verify/i,
    /banking.*secure/i,
    /confirm.*account/i,
    /suspended.*account/i,
    /unusual.*activity/i,
    /verify.*identity/i,
    /update.*payment/i,
    /claim.*prize/i,
    /won.*lottery/i,
    /free.*iphone/i,
    /click.*here.*now/i,
    /urgent.*action/i
  ];

  function isTrustedDomain(url) {
    try {
      const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
      return TRUSTED_DOMAINS.some((trusted) => hostname === trusted || hostname.endsWith("." + trusted));
    } catch {
      return false;
    }
  }

  function shouldOpenSandbox(url) {
    return !isTrustedDomain(url) && SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(url));
  }

  function openInSandbox(url) {
    chrome.runtime.sendMessage(
      { action: "openInSandbox", url },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("Failed to request sandbox:", chrome.runtime.lastError.message);
          return;
        }

        if (!response?.success) {
          console.error("Sandbox open failed:", response?.error || "Unknown error");
        }
      },
    );
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link?.href || !/^https?:\/\//i.test(link.href)) return;
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (!shouldOpenSandbox(link.href)) return;

    event.preventDefault();
    event.stopPropagation();
    openInSandbox(link.href);
  }, true);

  const originalOpen = window.open;
  window.open = function(url, name, specs) {
    try {
      if (typeof url === "string" && /^https?:\/\//i.test(url) && shouldOpenSandbox(url)) {
        openInSandbox(url);
        return null;
      }
    } catch {
      // Fall through to native window.open.
    }

    return originalOpen.apply(window, arguments);
  };
})();
