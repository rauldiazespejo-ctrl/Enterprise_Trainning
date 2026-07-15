## 2024-07-12 - [Reverse Tabnabbing]
**Vulnerability:** Found `target="_blank"` on static and dynamically created anchor tags (`<a>`) without `rel="noopener noreferrer"`.
**Learning:** Modern browsers mostly protect against this, but explicit definition is still a best practice, especially for dynamically created `document.createElement("a")` elements used for downloads where window reference can be leaked.
**Prevention:** Always explicitly define `rel="noopener noreferrer"` for any anchor tag (both in JSX and vanilla JS) that opens a new tab.
