## 2024-09-11 - Pagination structural semantics
**Learning:** Adding `aria-hidden="true"` to decorative icons inside screen-reader friendly buttons is necessary to prevent SRs from attempting to announce SVG details. Wrapping pagination in a `<nav>` with `aria-label` is required for structural context.
**Action:** Always wrap pagination elements in `<nav>` with a descriptive `aria-label` (in the local language) and apply `aria-hidden="true"` to SVG elements that function as purely decorative iconography within buttons.
