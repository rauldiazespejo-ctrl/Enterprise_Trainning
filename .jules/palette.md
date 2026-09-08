## 2025-05-18 - Pagination Accessibility
**Learning:** Pagination components require specific ARIA attributes (`aria-current="page"`, `aria-label`) and semantic HTML (`<nav>`) to be properly announced by screen readers, and dynamic summaries need `aria-live` to update users on data changes.
**Action:** Always wrap pagination controls in `<nav aria-label="...">`, use `aria-current="page"` on the active button, and apply `aria-live="polite"` to related dynamic summary text.
