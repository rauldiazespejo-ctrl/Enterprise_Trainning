## 2024-05-24 - Accessible Pagination Pattern
**Learning:** React generic pagination components often lack proper accessibility contexts, relying on divs rather than semantic nav elements, and omitting state announcements (aria-current) for screen readers.
**Action:** When implementing or fixing pagination, always wrap controls in `<nav aria-label="...">`, apply `aria-current="page"` to the active page button, and add `aria-live="polite" aria-atomic="true"` to dynamic text summaries (like "Showing 1-10 of 50").
