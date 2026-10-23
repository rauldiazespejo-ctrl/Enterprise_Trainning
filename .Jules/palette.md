## 2024-10-23 - Semantic Pagination and Screen Reader Clarity
**Learning:** Pagination controls often lack the necessary structural context for assistive technologies, and decorative structural elements like ellipsis can cause confusing announcements by screen readers.
**Action:** Always wrap pagination controls in a semantic `<nav>` element with a descriptive `aria-label` (e.g., `aria-label="Navegación de páginas"`), and explicitly hide decorative elements (like an ellipsis `<span>`) from screen readers using `aria-hidden="true"`.
