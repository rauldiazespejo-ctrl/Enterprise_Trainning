## 2024-07-18 - Semantic Navigation in Pagination
**Learning:** Pagination containers should use `<nav>` with an `aria-label` to be identifiable as a landmark region. Page buttons within need `aria-current="page"` to indicate active state and clear `aria-label`s for screen readers. Decorative elements like ellipsis should have `aria-hidden="true"`.
**Action:** Always verify structural elements like pagination have appropriate semantic tags and ARIA roles/labels when creating them or during refactoring.
