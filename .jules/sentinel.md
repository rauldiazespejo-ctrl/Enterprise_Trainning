## 2024-06-22 - [Fix] Reverse Tabnabbing Vulnerability
**Vulnerability:** External links created dynamically via `document.createElement("a")` or static `<a>` tags with `target="_blank"` did not explicitly include `rel="noopener noreferrer"`.
**Learning:** React automatically handles reverse tabnabbing for static links in recent versions, but dynamically created DOM elements or static anchor tags that open external links without `noopener` still pose a risk (e.g. allowing the newly opened tab to potentially execute `window.opener.location = ...`).
**Prevention:** Always append `rel="noopener noreferrer"` when setting `target="_blank"` on dynamically generated anchor elements or external links to prevent the opened tab from having access to the original `window.opener`.
