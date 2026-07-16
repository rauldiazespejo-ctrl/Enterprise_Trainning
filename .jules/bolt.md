## 2024-06-03 - [Replace O(N) Array.find with O(1) Map lookups]
**Learning:** Found nested O(N) lookups inside `.map()` arrays without memoization, leading to O(N*M) time complexity bottlenecks during synchronous renders.
**Action:** Convert nested O(N) array lookups (e.g., Array.prototype.find()) inside .map() or .filter() into O(1) Map lookups (memoized with useMemo()) to avoid O(N*M) time complexity bottlenecks during synchronous renders.
