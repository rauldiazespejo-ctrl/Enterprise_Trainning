## 2024-07-05 - Reverse Tabnabbing Vulnerability
**Vulnerability:** Found `target="_blank"` on anchor elements (`<a>`) without `rel="noopener noreferrer"`, both statically defined in JSX (`src/pages/admin/Settings.tsx`) and dynamically created via JavaScript (`src/pages/admin/DocumentRepository.tsx`).
**Learning:** When links open in a new tab without proper rel attributes, the newly opened page gains access to the original page's `window` object via `window.opener`. A malicious site could exploit this to redirect the original page to a phishing site or execute malicious scripts.
**Prevention:** Always include `rel="noopener noreferrer"` whenever using `target="_blank"` on anchor elements, whether statically in HTML/JSX or dynamically created in JS via `document.createElement('a')`.
