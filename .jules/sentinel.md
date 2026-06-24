## 2025-02-28 - [Fix Reverse Tabnabbing Vulnerability]
**Vulnerability:** Found `target="_blank"` on links without `rel="noopener noreferrer"`.
**Learning:** React automatically warns about this on JSX `<a>` tags, but it was missed on dynamically created DOM elements (`document.createElement('a')`) and on standard links in static JSX without linter rules.
**Prevention:** Always add `rel="noopener noreferrer"` when using `target="_blank"`, both in JSX and imperative DOM manipulation.
