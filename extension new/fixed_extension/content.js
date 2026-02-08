console.log("✅ TrustNet content script loaded:", location.href);

if (location.href.startsWith("chrome-extension://")) {
  console.log("Skipping extension page");
} else {
  chrome.runtime.sendMessage({
    action: "openSandbox",
    url: location.href
  });
}
