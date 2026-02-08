// content.js - Smart Link Interception (Only Scans Suspicious Links)

console.log("✅ TrustNet CyberCop content script loaded");

// Don't run on extension pages
if (location.href.startsWith("chrome-extension://")) {
  console.log("Skipping extension page");
}

// Don't run if already in sandbox
if (location.search.includes("sandboxed=true")) {
  console.log("Already in sandbox, skipping");
}

// Whitelist - trusted domains that should never be blocked
const TRUSTED_DOMAINS = [
  'google.com',
  'youtube.com',
  'github.com',
  'stackoverflow.com',
  'wikipedia.org',
  'microsoft.com',
  'apple.com',
  'amazon.com',
  'netflix.com',
  'twitter.com',
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'reddit.com'
];

// Suspicious patterns in URLs
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

// Check if domain is trusted
function isTrustedDomain(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase().replace('www.', '');
    
    return TRUSTED_DOMAINS.some(trusted => 
      hostname === trusted || hostname.endsWith('.' + trusted)
    );
  } catch {
    return false;
  }
}

// Check if URL looks suspicious
function looksLikeFraud(url) {
  // Check for suspicious patterns
  return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(url));
}

// Intercept link clicks
document.addEventListener('click', async (event) => {
  const link = event.target.closest('a');
  
  if (!link || !link.href) return;
  
  const url = link.href;
  
  // Skip non-http links
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return;
  }
  
  // Skip trusted domains
  if (isTrustedDomain(url)) {
    console.log("✅ Trusted domain, allowing:", url);
    return;
  }
  
  // Check for obvious fraud patterns
  if (looksLikeFraud(url)) {
    event.preventDefault();
    event.stopPropagation();
    
    console.log("⚠️ Suspicious pattern detected:", url);
    
    // Scan with API
    await scanAndHandle(url);
    return;
  }
  
  // For all other external links, do a quick background scan
  // (Don't block the click, just scan in background)
  scanInBackground(url);
  
}, true); // Use capture phase

// Scan URL and handle result
async function scanAndHandle(url) {
  try {
    // Show loading indicator
    const loading = document.createElement('div');
    loading.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1f2937;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      z-index: 999999;
      font-family: system-ui;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    loading.textContent = '🔍 Checking link safety...';
    document.body.appendChild(loading);

    // Request scan from background script
    const result = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: 'scanUrl', url: url },
        (response) => resolve(response)
      );
    });

    // Remove loading
    loading.remove();

    // Handle result
    if (result.error) {
      // If API is down, allow user to proceed
      const proceed = confirm(
        `⚠️ Unable to verify link safety.\n\n` +
        `URL: ${url}\n\n` +
        `API is not reachable. Proceed anyway?`
      );
      
      if (proceed) {
        window.location.href = url;
      }
      return;
    }

    if (result.status === 'Dangerous') {
      const choice = confirm(
        `🚨 DANGER: This link is highly suspicious!\n\n` +
        `URL: ${url}\n` +
        `Phishing Probability: ${result.phishing_chance}%\n\n` +
        `❌ Click CANCEL to stay safe (recommended)\n` +
        `⚠️ Click OK to open in sandbox (advanced users only)`
      );
      
      if (choice) {
        // Open in sandbox
        chrome.runtime.sendMessage({
          action: 'openSandbox',
          url: url
        });
      }
    } else if (result.status === 'Suspicious') {
      const proceed = confirm(
        `⚠️ CAUTION: This link appears suspicious.\n\n` +
        `URL: ${url}\n` +
        `Phishing Probability: ${result.phishing_chance}%\n\n` +
        `Do you want to continue?`
      );
      
      if (proceed) {
        window.location.href = url;
      }
    } else {
      // Safe - proceed
      window.location.href = url;
    }

  } catch (error) {
    console.error('Error scanning URL:', error);
    
    // On error, ask user
    const proceed = confirm(
      `⚠️ Error checking link.\n\nURL: ${url}\n\nProceed anyway?`
    );
    
    if (proceed) {
      window.location.href = url;
    }
  }
}

// Scan in background without blocking
function scanInBackground(url) {
  chrome.runtime.sendMessage(
    { action: 'scanUrl', url: url },
    (response) => {
      if (response && response.status === 'Dangerous') {
        console.warn('⚠️ Dangerous link detected:', url);
        // Could show a subtle warning badge on the link
      }
    }
  );
}

// Highlight suspicious links on the page
function highlightSuspiciousLinks() {
  const links = document.querySelectorAll('a[href]');
  
  links.forEach(link => {
    const url = link.href;
    
    if (looksLikeFraud(url) && !isTrustedDomain(url)) {
      // Add warning indicator
      link.style.backgroundColor = '#fef3c7';
      link.style.outline = '2px solid #f59e0b';
      link.style.outlineOffset = '2px';
      link.title = '⚠️ TrustNet: This link appears suspicious';
    }
  });
}

// Run highlighting after page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', highlightSuspiciousLinks);
} else {
  highlightSuspiciousLinks();
}

// Watch for dynamically added links
const observer = new MutationObserver(() => {
  highlightSuspiciousLinks();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
