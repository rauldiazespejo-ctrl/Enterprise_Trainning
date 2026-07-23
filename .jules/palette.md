## 2024-07-23 - Pagination Accessibility Enhancements
**Learning:** Screen readers cannot deduce the structure and purpose of generic `<div>` wrappers for pagination, nor the state of current pages, without explicit semantics (`<nav>`, `aria-current`, `aria-label`, `aria-hidden` on SVGs/ellipses).
**Action:** Wrap pagination structures in semantic `<nav>` elements, hide decorative icons with `aria-hidden`, identify the active page with `aria-current="page"`, and apply `aria-live="polite"` to summary statistics.
