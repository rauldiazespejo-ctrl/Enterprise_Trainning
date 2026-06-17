## 2024-05-24 - React useMemo on derived list computations
**Learning:** Found that unmemoized `.filter()` and `.map()` calls during render block the main thread on user input (like typing in a search bar), leading to sluggish UI updates.
**Action:** Wrap derived list computations and search filters in `useMemo` to prevent synchronous O(N) recalculations across renders.
