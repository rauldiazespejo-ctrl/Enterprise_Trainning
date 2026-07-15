## 2024-05-18 - Semantic Pagination Accessibility
**Learning:** Pagination components using generic `<div>` wrappers and without `aria-current` provide poor context to screen readers, making it hard to identify the navigation region and the currently active page.
**Action:** Always wrap pagination controls in a semantic `<nav aria-label="...">` element. Use `aria-label` for page numbers (e.g. "Página X") and `aria-current="page"` for the active page button. Ensure decorative elements like ellipsis have `aria-hidden="true"`.
