## 2024-03-27 - Navigating Pagination Contexts
**Learning:** Generic flexbox divs used as pagination wrappers omit vital structural context. Hiding decorative ellipsis using `aria-hidden` and explicitly dictating the active page via `aria-current` provides enormous clarity to screen reader navigation that standard visual cues completely miss.
**Action:** When building custom pagination widgets, ALWAYS wrap them in `<nav aria-label="Pagination">`, use `aria-current="page"` on the active step, and add contextual `aria-label`s specifying exact page targets.
