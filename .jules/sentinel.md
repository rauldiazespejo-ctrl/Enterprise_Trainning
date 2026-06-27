## 2024-05-18 - Prevent Reverse Tabnabbing Vulnerability
**Vulnerability:** Anchor tags with `target="_blank"` missing `rel="noopener noreferrer"`.
**Learning:** This exposes the application to reverse tabnabbing, allowing a newly opened tab to potentially hijack the original tab via the `window.opener` object.
**Prevention:** Always include `rel="noopener noreferrer"` when using `target="_blank"`, including dynamically created elements via `document.createElement("a")`.
