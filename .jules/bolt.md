## 2024-10-27 - O(1) Map Lookups in React Render Cycles
**Learning:** Performing `Array.prototype.find()` inside `.map()` or `.filter()` during synchronous React renders blocks the main thread, resulting in O(N*M) time complexity bottlenecks which are especially noticeable during events like search input typing.
**Action:** Convert nested O(N) array lookups into O(1) `Map` lookups, and ensure derived list computations are memoized using `useMemo()` to prevent recalculations on every render.
