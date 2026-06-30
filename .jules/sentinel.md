## 2026-06-30 - [Reverse Tabnabbing Vulnerability Fix]
**Vulnerability:** Anchor tags with `target="_blank"` missing the `rel="noopener noreferrer"` attribute.
**Learning:** Found instances where `target="_blank"` was set programmatically via `document.createElement('a')` and statically in JSX without the accompanying `rel` attribute, which could lead to reverse tabnabbing attacks where a new tab can manipulate the original page.
**Prevention:** Always ensure that when setting `target="_blank"`, whether in static JSX or dynamic element creation, the `rel="noopener noreferrer"` attribute is also applied to mitigate tabnabbing risks.
