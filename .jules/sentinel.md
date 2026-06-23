## 2025-02-27 - [Reverse Tabnabbing Vulnerability via target="_blank"]
**Vulnerability:** Found `target="_blank"` on links without `rel="noopener noreferrer"`. This exposes the site to a "reverse tabnabbing" attack where the newly opened page gains access to the window object of the original page and can redirect it to a malicious URL.
**Learning:** This can occur both in standard HTML `<a>` tags and dynamically created elements (`document.createElement('a')`).
**Prevention:** Always include `rel="noopener noreferrer"` when using `target="_blank"`.
