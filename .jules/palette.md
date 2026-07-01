## 2025-05-18 - Prevent Redundant Screen Reader Announcements in Icon Buttons
**Learning:** Icon-only buttons often cause double announcements or unhelpful reading by screen readers if the inner icon (e.g., Lucide React SVG) is not hidden from the accessibility tree, even when the parent button has an `aria-label`.
**Action:** When adding `aria-label` to icon-only `<button>` elements, always explicitly add `aria-hidden="true"` to the inner `<svg>` or icon component to ensure a clean, single announcement.
