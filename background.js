// Store tabs that should bypass sandboxing
const bypassTabs = new Set();

chrome.runtime.onInstalled.addListener(() => {
	console.log("PhishShield AI extension installed");
});

chrome.omnibox.onInputEntered.addListener((text, disposition) => {
	let url = text;

	if (!url.match(/^https?:\/\//)) {
		url = "https://" + url;
	}

	try {
		new URL(url);
		openInSandbox(url);
	} catch (error) {
		console.error("Invalid URL:", url);
	}
});

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
	// Only intercept main frame navigations
	if (details.frameId !== 0 || !details.tabId) return;

	// Check if this tab should bypass sandboxing
	if (bypassTabs.has(details.tabId)) {
		console.log("Bypassing sandbox for tab:", details.tabId);
		bypassTabs.delete(details.tabId); // Remove after use
		return;
	}

	// Check if URL has nosandbox parameter
	try {
		const urlObj = new URL(details.url);
		if (urlObj.searchParams.has("nosandbox")) {
			console.log("URL has nosandbox parameter, bypassing sandbox");
			return;
		}
	} catch (e) {
		// Invalid URL, continue with normal flow
	}

	// Don't intercept if it's already our sandbox page
	if (details.url.includes(chrome.runtime.getURL("sandbox.html"))) {
		return;
	}

	// Check if we should sandbox this URL
	if (shouldSandboxUrl(details.url)) {
		console.log("Intercepting navigation to sandbox:", details.url);
		chrome.tabs.update(details.tabId, {
			url:
				chrome.runtime.getURL("sandbox.html") +
				"?url=" +
				encodeURIComponent(details.url),
		});
	}
});

let latestPhishingData = null;

// Listen for messages from sandbox/content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "phishingResult") {
		latestPhishingData = message.data;
	}

	if (message.action === "getLatestData") {
		sendResponse(latestPhishingData);
	}
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	console.log(
		"Received message:",
		request.action,
		"from",
		sender.tab?.id || "unknown",
	);

	try {
		if (request.action === "openInSandbox") {
			openInSandbox(request.url);
			sendResponse({ success: true });
			return false; // Synchronous response
		} else if (request.action === "openOriginal") {
			console.log("Processing openOriginal request for:", request.url);

			// Validate URL
			if (!request.url) {
				sendResponse({ success: false, error: "No URL provided" });
				return false;
			}

			// Create a new tab and mark it to bypass sandboxing
			chrome.tabs
				.create({
					url: request.url,
					active: true,
				})
				.then((tab) => {
					bypassTabs.add(tab.id);
					console.log("Created bypass tab:", tab.id, "for URL:", request.url);
					sendResponse({ success: true, tabId: tab.id });
				})
				.catch((error) => {
					console.error("Failed to create tab:", error);
					sendResponse({ success: false, error: error.message });
				});

			return true; // Keep message channel open for async response
		}

		// Unknown action
		console.warn("Unknown action:", request.action);
		sendResponse({
			success: false,
			error: "Unknown action: " + request.action,
		});
		return false;
	} catch (error) {
		console.error("Error in message handler:", error);
		sendResponse({ success: false, error: error.message });
		return false;
	}
});

// Clean up bypass tabs when they're closed
chrome.tabs.onRemoved.addListener((tabId) => {
	if (bypassTabs.has(tabId)) {
		bypassTabs.delete(tabId);
		console.log("Cleaned up bypass tab:", tabId);
	}
});

// Also clean up bypass tabs on startup (in case extension was reloaded)
chrome.runtime.onStartup.addListener(() => {
	bypassTabs.clear();
	console.log("Cleared bypass tabs on startup");
});

function openInSandbox(url) {
	const sandboxUrl =
		chrome.runtime.getURL("sandbox.html") + "?url=" + encodeURIComponent(url);

	chrome.tabs.create({
		url: sandboxUrl,
		active: true,
	});
}

function shouldSandboxUrl(url) {
	try {
		const urlObj = new URL(url);

		// Don't sandbox chrome:// URLs, extension URLs, or local URLs
		if (
			urlObj.protocol === "chrome:" ||
			urlObj.protocol === "chrome-extension:" ||
			urlObj.hostname === "localhost" ||
			urlObj.hostname === "127.0.0.1"
		) {
			return false;
		}

		return true;
	} catch (error) {
		return false;
	}
}
