## 2024-07-16 - O(N) nested aggregations in React render
**Learning:** Calling functions containing array filters (e.g. O(N)) inside `.reduce`, `.map`, and `.filter` callbacks during a React render causes an O(N*M) algorithmic bottleneck that heavily impacts performance on large lists.
**Action:** Convert nested loop aggregations to use a memoized `Map` for O(1) lookups, and properly memoize derived lists and aggregations with `useMemo` so they don't block the main thread on unrelated state updates.
