## 2025-02-27 - [Fix reverse tabnabbing via target="_blank"]
**Vulnerability:** External and downloaded file links that use `target="_blank"` without `rel="noopener noreferrer"`.
**Learning:** React handles dynamic anchor tags created via `document.createElement` exactly like DOM elements, meaning they're susceptible to reverse tabnabbing just like standard JSX anchor tags.
**Prevention:** When dynamically creating or statically defining anchor tags with `target="_blank"`, ensure `rel="noopener noreferrer"` is included (e.g. `a.rel = 'noopener noreferrer';`).
