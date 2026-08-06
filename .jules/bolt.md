## 2023-10-24 - Unmemoized O(N*M) lookups inside renders

**Learning:** Unmemoized array iterations (like `.map` or `.filter`) containing `.find()` lookups on other arrays result in O(N*M) time complexity. Doing this inside React renders blocks the main thread on every re-render, degrading user experience.

**Action:** Wrap derived list computations and stats aggregations inside `useMemo()`. Convert nested O(N) array lookups inside `.map()` or `.filter()` into O(1) `Map` lookups (also memoized) to reduce time complexity to O(N).
