
## 2024-03-24 - Accessibility upgrades in Pagination Component
**Learning:** Pagination components often lack semantic structure (like `<nav>`), live announcements for dynamic data updates, visible focus indicators on individual page numbers, and proper indications for the currently active page for screen reader users.
**Action:** When building pagination components, ensure to:
- Wrap controls in a `<nav>` element with a descriptive `aria-label`.
- Apply `aria-live="polite"` and `aria-atomic="true"` to summary elements indicating shown items.
- Ensure the active page button uses `aria-current="page"`.
- Use `focus-ring` classes to ensure visible focus across interactive buttons.
- Hide purely decorative icons from screen readers (`aria-hidden="true"`).
