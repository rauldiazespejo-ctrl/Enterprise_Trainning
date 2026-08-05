## 2025-03-09 - Pagination Accessibility
**Learning:** Pagination controls often lack semantic structure and context for screen readers. Using just divs makes navigation difficult.
**Action:** Always wrap pagination in a `<nav aria-label="...">`. Use `aria-current="page"` for the active button, `aria-label` for page numbers, `aria-hidden="true"` on decorative ellipsis, and `aria-live="polite"` with `aria-atomic="true"` on dynamic summary text (e.g., "Mostrando 1-10 de 50").
