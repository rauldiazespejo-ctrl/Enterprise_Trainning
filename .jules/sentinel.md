## 2026-07-10 - Reverse Tabnabbing Vulnerability
**Vulnerability:** External links (`target="_blank"`) missing `rel="noopener noreferrer"`.
**Learning:** This exposes the `window.opener` object to the external site, allowing it to potentially redirect the original application page to a malicious URL. This was present both in static JSX and dynamic anchor creation.
**Prevention:** Always include `rel="noopener noreferrer"` when using `target="_blank"` on static and dynamically created anchor tags.
