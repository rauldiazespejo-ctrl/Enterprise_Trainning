## Bolt's Journal
## 2026-06-22 - O(N²) Arrays Lookup Optimization
**Learning:** Found O(N) array lookups (Array.prototype.find()) nested inside .map() and .filter() during synchronous rendering, causing an O(N*M) time complexity bottleneck. This occurs frequently in Admin tables where lists of relationships (like assignments to employees and courses) are fetched in arrays.
**Action:** Replaced .find() with O(1) Map lookups, and memoized derived list computations (like map/filter) using useMemo() so they aren't recalculating needlessly during state changes like search input typing.
