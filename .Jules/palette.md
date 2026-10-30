## 2023-10-30 - Accessible Pagination Navigation
**Learning:** Pagination components often rely on generic structural elements like `<div>` for grouping, which lacks semantic meaning for assistive technologies, and icon-only components may be unnecessarily read out by screen readers.
**Action:** When building pagination components, wrap the controls in a `<nav aria-label="...">` element. Explicitly indicate the current page with `aria-current="page"`, and hide decorative icons and ellipsis with `aria-hidden="true"`.
