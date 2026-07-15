## 2024-05-24 - Missing rel="noopener noreferrer" on dynamically created anchor elements
**Vulnerability:** Dynamically created anchor elements with `target="_blank"` in React (e.g. `document.createElement('a')`) are missing `rel="noopener noreferrer"` which can lead to reverse tabnabbing vulnerabilities.
**Learning:** React elements naturally need this but when we dynamically create DOM elements to trigger downloads or open links, we easily miss standard security attributes.
**Prevention:** Always add `rel = 'noopener noreferrer'` when assigning `target = '_blank'` to any anchor element, statically or dynamically created.
