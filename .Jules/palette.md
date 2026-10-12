## 2024-10-12 - Pagination Accessibility and Touch Targets
**Learning:** Pagination controls require semantic `<nav>` wrappers, individual `aria-label`s for page numbers, `aria-current="page"` for active state, and `aria-hidden="true"` for decorative ellipsis to ensure assistive technology compatibility. Adding `tap-target-min` and `focus-ring` improves mobile usability and keyboard navigation.
**Action:** Always wrap pagination in a semantic `<nav>`, apply proper ARIA labels/states, and enforce minimum touch targets and focus visibility.
