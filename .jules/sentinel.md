## 2024-05-24 - [Reverse Tabnabbing]
**Vulnerability:** Found `target="_blank"` without `rel="noopener noreferrer"` on static anchors and dynamically created ones (`a.target = '_blank'`).
**Learning:** Reverse tabnabbing can allow the opened tab to redirect the original page to a malicious site using `window.opener.location`. This is risky especially in dynamically constructed `a` elements or regular links opening external resources.
**Prevention:** Always add `rel="noopener noreferrer"` whenever `target="_blank"` is used, both in JSX and in vanilla JS `document.createElement('a')` implementations.
