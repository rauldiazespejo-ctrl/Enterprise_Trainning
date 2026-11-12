## 2024-06-25 - Fix Tabnabbing in target="_blank" links
**Vulnerability:** Found multiple dynamically created anchor tags (document.createElement('a')) and JSX elements using target="_blank" without the corresponding rel="noopener noreferrer" attribute.
**Learning:** This exposes the application to reverse tabnabbing attacks, where the newly opened tab can gain access to the window.opener object of the original page, potentially allowing it to navigate the original page to a malicious site.
**Prevention:** Always include rel="noopener noreferrer" when using target="_blank" on anchor tags, both in JSX and when manipulating the DOM dynamically.
