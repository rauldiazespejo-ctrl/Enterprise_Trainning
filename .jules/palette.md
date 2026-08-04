## 2024-05-18 - Semantic Pagination Structure
**Learning:** Pagination containers in this app often lacked the semantic `<nav>` wrapper and the `aria-live` regions needed for assistive tech to announce page changes without interrupting the user.
**Action:** Always wrap pagination controls in a `<nav>` with a descriptive `aria-label` (e.g., "Navegación de páginas") and ensure dynamic summary text (e.g., "Mostrando 1 - 10 de 50") uses `aria-live="polite"` and `aria-atomic="true"`. Use `aria-current="page"` on the currently active page button.
