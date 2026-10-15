## 2024-10-15 - Pagination component accessibility

**Learning:** Pagination controls lacked structural context (a wrapping `<nav>` element) and state indicators (`aria-current` for the active page, explicit `aria-label`s for each page number, and hidden ellipsis) that are crucial for screen readers to interpret and navigate through lists of items effectively.
**Action:** When building pagination components, ensure they are wrapped in a semantic `<nav aria-label="...">` element. Include `aria-current="page"` on the active button, individual `aria-label`s for each page number, and use `aria-hidden="true"` to hide decorative ellipsis `<span>`s from assistive technologies. Use existing focus indicator classes like `.focus-ring` to provide keyboard users with clear visual feedback.
