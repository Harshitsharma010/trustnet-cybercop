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
		} else if (request.action === "openSandbox") {
			openInSandbox(request.url);
			sendResponse({ success: true });
			return false;
		} else if (request.action === "openOriginal") {
			console.log("Processing openOriginal request for:", request.url);

			// Validate URL
			if (!request.url) {
				sendResponse({ success: false, error: "No URL provided" });
				return false;
			}

			chrome.tabs
				.create({
					url: request.url,
					active: true,
				})
				.then((tab) => {
					console.log("Opened original tab:", tab.id, "for URL:", request.url);
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

function openInSandbox(url) {
	const sandboxUrl =
		chrome.runtime.getURL("sandbox.html") + "?url=" + encodeURIComponent(url);

	chrome.tabs.create({
		url: sandboxUrl,
		active: true,
	});
}
