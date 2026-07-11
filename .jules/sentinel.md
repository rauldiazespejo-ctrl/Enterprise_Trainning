## 2024-03-24 - [Fix Reverse Tabnabbing]
**Vulnerability:** Anchor elements (both static JSX `<a>` and dynamically created via `document.createElement('a')`) using `target="_blank"` lacked explicit `rel="noopener noreferrer"`.
**Learning:** This missing attribute allows newly opened tabs to potentially access the `window.opener` object of the originating page, posing a reverse tabnabbing risk. While modern browsers largely mitigate this by default, explicitly declaring it remains a standard defense-in-depth practice, especially for file download links or external sites.
**Prevention:** Always include `rel="noopener noreferrer"` when setting `target="_blank"` on anchor elements, whether dynamically generated in JS/TS or statically in React templates.
