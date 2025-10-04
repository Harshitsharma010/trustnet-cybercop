
Link Sandbox Opener + Keyword Highlighter - README

What this extension does:
- Intercepts user clicks on http/https links in web pages and opens them in a new tab that loads an extension page (sandbox.html).
- The extension page shows the target site inside an <iframe sandbox="..."> to limit capabilities (forms/scripts/same-origin allowed).
- The content script also highlights words that contain "fuck" (e.g., "fuck", "fucking", "motherfucker") by coloring them red and bold.

How to install:
1. Download the ZIP and extract it.
2. Open Chrome -> Extensions -> Toggle Developer mode -> Load unpacked -> Select the extracted folder.
3. The extension will start working automatically; clicking links will open them inside the sandbox page.

Limitations & important notes:
- Many websites send headers like X-Frame-Options or CSP frame-ancestors that prevent being displayed inside an iframe. In such cases the iframe will not show the site; use 'Open original' button in the sandbox page.
- This extension intercepts anchor clicks in pages. It cannot intercept typed URLs in the omnibox, bookmarks, or extensions that open links directly.
- Because of cross-origin restrictions, the extension cannot access or fully control framed cross-origin pages.
- The sandboxed iframe uses "allow-scripts" and "allow-same-origin", which makes it more permissive; you can remove these flags in sandbox.html to make it stricter (e.g., remove allow-same-origin if you want stronger isolation).
- Use responsibly. Highlighting code is simple string-based matching and may produce false positives.

