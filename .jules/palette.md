## 2026-07-12 - Semantic Navigation Landmark for Pagination
**Learning:** Pagination containers should be wrapped in semantic `<nav>` elements with `aria-label` (e.g., "Navegación de páginas"), individual page buttons should have `aria-label` and `aria-current`, and decorative ellipsis should be hidden with `aria-hidden='true'`.
**Action:** Always implement pagination components using semantic navigation landmarks and explicit ARIA states to ensure they are discoverable and navigable for screen reader users.
