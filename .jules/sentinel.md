## 2026-07-04 - [Reverse Tabnabbing Vulnerability via target="_blank"]
**Vulnerability:** Found `target="_blank"` used without `rel="noopener noreferrer"` statically in `Settings.tsx` and dynamically in `DocumentRepository.tsx` via `document.createElement('a')`.
**Learning:** Using `target="_blank"` without `rel="noopener noreferrer"` can expose the site to reverse tabnabbing vulnerabilities, allowing the opened page to potentially execute malicious JavaScript against the originating page via `window.opener`.
**Prevention:** Always add `rel="noopener noreferrer"` (or `a.rel = 'noopener noreferrer'`) whenever `target="_blank"` is used, both in static HTML/JSX and dynamically created elements.
