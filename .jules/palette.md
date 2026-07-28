## 2024-07-28 - Enhance Pagination accessibility
**Learning:** When implementing pagination controls, replacing generic `div` tags with `<nav aria-label="...">` and adding `aria-current="page"` significantly improves keyboard and screen reader navigation. Furthermore, `aria-live="polite"` correctly announces dynamic list updates to assistive technologies.
**Action:** Always wrap pagination components in `<nav>`, use `aria-current` for active items, set `aria-hidden` on visual ellipses, and use `aria-live` on pagination summary text.
