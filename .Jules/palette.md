## 2024-05-18 - Added `aria-current` to Navigation Links
**Learning:** `aria-current="page"` is essential on `<Link>` (or `<a>`) tags that point to the current active route. This significantly helps screen reader users understand their current context without needing to deduce it from visual cues like active classes.
**Action:** Always add `aria-current="page"` to the active item in navigation lists, breadcrumbs, and pagination components to ensure proper semantic context.
