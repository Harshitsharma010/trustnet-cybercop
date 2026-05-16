(function() {
  const extensionSandboxBase = chrome.runtime.getURL("sandbox.html");

  function openInSandbox(url) {
    try {
      const target = extensionSandboxBase + "?url=" + encodeURIComponent(url);
      window.open(target, "_blank");
    } catch (e) {
      console.error("Failed to open sandbox:", e);
    }
  }

  document.addEventListener("click", function(e) {
    let a = e.target;
    while (a && a.tagName !== "A") a = a.parentElement;
    if (!a || !a.href) return;
    if (!/^https?:\/\//i.test(a.href)) return;

    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

    e.preventDefault();
    e.stopPropagation();
    openInSandbox(a.href);
  }, true);

  const originalOpen = window.open;
  window.open = function(url, name, specs) {
    try {
      if (typeof url === "string" && /^https?:\/\//i.test(url)) {
        openInSandbox(url);
        return null;
      }
    } catch (e) { }
    return originalOpen.apply(window, arguments);
  };

  function highlightBadWords(root) {
    const regex = /\b\w*fuck\w*\b/gi;

    function walk(node) {
      if (!node) return;
      let child = node.firstChild;
      while (child) {
        const next = child.nextSibling;
        if (child.nodeType === 3) {
          handleText(child);
        } else if (child.nodeType === 1 && child.tagName !== "SCRIPT" && child.tagName !== "STYLE" && child.tagName !== "IFRAME") {
          walk(child);
        }
        child = next;
      }
    }

    function handleText(textNode) {
      const text = textNode.nodeValue;
      if (!text) return;
      if (!regex.test(text)) return;
      const span = document.createElement("span");
      span.innerHTML = text.replace(regex, (match) => {
        return `<span style="color: #e60000; font-weight:700; background: rgba(255,230,230,0.4);">${match}</span>`;
      });
      if (textNode.parentNode) {
        textNode.parentNode.replaceChild(span, textNode);
      }
    }

    try {
      walk(root || document.body);
    } catch (e) {
      console.error("Highlighting error:", e);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    highlightBadWords(document.body);
    setTimeout(() => highlightBadWords(document.body), 1500);
  });

  highlightBadWords(document.body);
})();
