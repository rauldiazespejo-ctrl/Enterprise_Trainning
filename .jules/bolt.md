## 2024-05-15 - Optimizing nested array loop bottlenecks in React
**Learning:** Calling functions that perform `.filter()` on large arrays inside list iterations (like `.map` or `.reduce`) creates a hidden O(N*M) performance bottleneck on every render.
**Action:** When aggregating derived data for lists, construct a lookup `Map` with a single pass using `useMemo` outside the loop, enabling O(1) retrieval and reducing complexity to O(N+M).
