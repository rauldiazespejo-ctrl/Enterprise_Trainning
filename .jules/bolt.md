## 2024-06-28 - Optimize derived data with useMemo and O(1) Map lookups
**Learning:** In the React frontend, calculating derived state like joining lists via nested array loops (e.g., `Array.prototype.find()` inside `.map()`) can cause O(N*M) bottlenecks during synchronous renders, especially on frequent events like search input changes.
**Action:** Always wrap derived list computations in `useMemo()` and refactor nested O(N) array lookups into O(1) `Map` lookups to optimize rendering performance in components handling large datasets.
