## 2024-10-23 - Accessibility improvements for pagination

**Learning:** When building pagination components, it's essential to use semantic `<nav>` elements with descriptive `aria-label`s to give assistive technologies appropriate structural context. Additionally, decorative navigational elements like ellipsis or chevron icons should have `aria-hidden="true"`, and the currently active page must use `aria-current="page"` to avoid confusion during screen reader navigation.

**Action:** Ensure all pagination elements enforce semantic context by using `<nav>` instead of `<div>`, strictly hide purely visual elements, and always associate descriptive labels (such as "Página X") and `aria-current` properties with individual page controls.
