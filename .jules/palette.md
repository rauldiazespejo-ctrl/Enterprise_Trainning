## 2024-05-24 - Accessibility for Icon-only Buttons
**Learning:** Icon-only buttons used for actions like removing files or expanding/collapsing sections need `aria-label` to be announced by screen readers. The inner SVG icons should have `aria-hidden="true"` to prevent redundant announcements. For toggle buttons, `aria-expanded` is essential to communicate state.
**Action:** Always add `aria-label` to `<button>` elements lacking text content, `aria-hidden="true"` to their child SVGs, and `aria-expanded` for toggles. Ensure labels match the application's language (Spanish in this repo).
