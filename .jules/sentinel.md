## 2026-07-01 - [Reverse Tabnabbing]
**Vulnerability:** Found an external link with `target="_blank"` missing the `rel="noopener noreferrer"` attribute in `src/pages/admin/Settings.tsx`.
**Learning:** This exposes the application to a reverse tabnabbing attack, where the newly opened page can access the `window.opener` object and potentially navigate the original page to a malicious site.
**Prevention:** Always add `rel="noopener noreferrer"` to anchor tags using `target="_blank"`, especially for external links.
