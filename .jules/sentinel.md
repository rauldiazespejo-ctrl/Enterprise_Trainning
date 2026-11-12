## 2026-06-21 - [Reverse Tabnabbing Mitigation]
**Vulnerability:** Found anchor tags with `target="_blank"` missing the `rel="noopener noreferrer"` attribute, specifically in dynamic element creation (`DocumentRepository.tsx`) and static links (`Settings.tsx`).
**Learning:** When creating links that open in new tabs, either statically in JSX or dynamically via `document.createElement('a')`, omitting `rel="noopener noreferrer"` exposes the application to reverse tabnabbing, allowing the newly opened tab to potentially control the `window.opener` object.
**Prevention:** Always pair `target="_blank"` with `rel="noopener noreferrer"`.
