## 2024-03-24 - [Fix reverse tabnabbing]
**Vulnerability:** External links opened in a new tab (`target="_blank"`) without the `rel="noopener noreferrer"` attribute, allowing the new tab to access the `window.opener` object.
**Learning:** Missing `rel="noopener noreferrer"` allows the destination site to manipulate the `window.opener.location` and potentially redirect the user's original tab to a malicious site.
**Prevention:** Always add `rel="noopener noreferrer"` to external links that open in new tabs.
