## 2026-10-25 - Pagination Accessibility Improvements
**Learning:** Pagination controls often lack semantic structure and proper active state announcements for screen readers.
**Action:** Always wrap pagination in a `<nav>` with an `aria-label`, use `aria-current='page'` for the active page, and hide decorative elements like ellipsis or icons with `aria-hidden='true'`.
