## 2024-05-24 - [Reverse Tabnabbing Vulnerability via target="_blank"]
**Vulnerability:** Found `target="_blank"` on anchor elements in both static JSX and dynamically created `document.createElement('a')` elements without `rel="noopener noreferrer"`.
**Learning:** React handles static JSX well by generating warnings or even auto-adding the `rel` attribute in some newer versions, but custom dynamically created anchor elements used for file downloads completely bypass standard linting rules or auto-fixes for reverse tabnabbing.
**Prevention:** Ensure explicit `rel="noopener noreferrer"` is added to *every* element where `target="_blank"` is applied, especially dynamically built DOM nodes (`document.createElement('a')`).
