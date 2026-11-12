## 2024-06-25 - React Component Array Transformations
**Learning:** Found O(N*M) nested array lookups (e.g. `Array.prototype.find()` inside `.map()`) and derived list computations inside synchronous React renders without memoization. This blocks the main thread during typing and re-renders.
**Action:** Convert nested array lookups into O(1) `Map` lookups and wrap derived list computations (`.filter()`, `.map()`, and aggregations) inside `useMemo()` to prevent recalculations across renders.
