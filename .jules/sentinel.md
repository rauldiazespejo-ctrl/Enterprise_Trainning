
## 2024-06-03 - Prevent Reverse Tabnabbing on Dynamic Anchors
**Vulnerability:** A dynamically created `<a>` element used for file downloads had `target="_blank"` set without the `rel="noopener noreferrer"` attribute, exposing a potential reverse tabnabbing vulnerability.
**Learning:** Even dynamically constructed links triggered via `click()` need these security attributes when opening in new tabs, as the browser can still expose `window.opener` to the target page.
**Prevention:** Always set `a.rel = 'noopener noreferrer';` immediately after setting `a.target = '_blank';` when programmatically creating links.
