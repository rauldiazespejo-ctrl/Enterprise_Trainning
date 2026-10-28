## 2024-03-20 - Palette Journal Setup
**Learning:** Initializing journal for tracking UX/a11y patterns.
**Action:** Ready to record critical learnings for this project.
## 2024-03-20 - Semantic Pagination
**Learning:** Pagination controls often lack semantic structure and state management. Using a `nav` element with `aria-label` provides structural context, while `aria-current="page"` explicitly indicates the active page to screen readers. Hiding decorative elements like ellipses with `aria-hidden="true"` reduces noise.
**Action:** Always wrap pagination in a semantic `<nav>` and explicitly manage `aria-current` for the active page, avoiding reliance on visual styles alone.
