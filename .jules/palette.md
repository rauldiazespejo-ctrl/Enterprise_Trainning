## 2023-10-27 - Semantic Pagination Accessibility
**Learning:** Generic `<div>` wrappers for pagination controls lack structural context for assistive technologies, and visual focus states are often missed on pagination buttons.
**Action:** Always wrap pagination controls in a semantic `<nav aria-label="...">` element. Ensure active pages use `aria-current="page"`, decorative elements like ellipses use `aria-hidden="true"`, and apply `focus-ring` and `tap-target-min` to all interactive pagination elements.
