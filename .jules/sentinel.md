## 2024-05-20 - [Reverse Tabnabbing Vulnerability in Target Blank Links]
**Vulnerability:** External links with `target="_blank"` missing `rel="noopener noreferrer"`.
**Learning:** This is a common React/HTML vulnerability known as reverse tabnabbing, allowing the newly opened tab to access `window.opener` and potentially change the location of the original tab. Found in dynamically created elements and raw HTML anchors.
**Prevention:** Always add `rel="noopener noreferrer"` whenever using `target="_blank"`, both in static JSX/HTML and dynamically via `a.rel = 'noopener noreferrer'`.
