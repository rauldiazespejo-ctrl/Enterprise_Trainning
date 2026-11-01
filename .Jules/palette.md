## 2024-03-20 - Pagination Accessibility
**Learning:** Found that the pagination component was using visual indicators (`bg-brand text-white`) for the current page, but lacked programmatic semantics (`aria-current="page"`) to inform screen readers which page is currently active.
**Action:** Always add `aria-current="page"` to the active page button in pagination components to ensure screen reader users can identify their current location within the paginated set.
