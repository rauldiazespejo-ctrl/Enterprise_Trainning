## 2023-10-25 - [Pagination Accessibility Improvements]
**Learning:** Decorative ellipsis in pagination should have `aria-hidden="true"` to prevent screen readers from reading out the "..." loudly. The `<nav>` element is better for screen readers to recognize it as a navigation block.
**Action:** When building pagination components, always use a semantic `<nav>` with `aria-label`, ensure active page has `aria-current="page"`, add `aria-label` to each page button, and hide decorative elements like ellipsis with `aria-hidden="true"`.
