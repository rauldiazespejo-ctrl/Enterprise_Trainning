## 2026-09-19 - Pagination Accessibility (Semantic HTML)
**Learning:** Pagination controls often lack semantic structure and proper current-page indication out-of-the-box, making navigation confusing for screen reader users. Simply using divs for pagination creates a flat structure.
**Action:** Always wrap pagination in a semantic `<nav>` with an appropriate `aria-label` (e.g., 'Navegación de páginas'), explicitly mark the current page using `aria-current="page"`, and apply focus/tap-target classes for keyboard/mobile users.
