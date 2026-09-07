## 2026-09-07 - Pagination Accessibility Improvement
**Learning:** In Spanish-localized React applications, pagination wrappers should use semantic `<nav aria-label="Navegación de páginas">`. Additionally, dynamic status texts (e.g., "Showing 1 - 10") should have `aria-live="polite"` and `aria-atomic="true"` to ensure screen readers announce updates dynamically without breaking user flow. Finally, ellipsis dividers must be hidden with `aria-hidden="true"`.
**Action:** Apply these precise ARIA attributes to any new pagination or dynamic list components created in the future.
