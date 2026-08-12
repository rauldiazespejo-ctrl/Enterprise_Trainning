## 2024-05-18 - Optimize multiple array filter and map passes
**Learning:** Performing multiple sequential `.filter()`, `.map()`, and `.find()` passes on the same arrays in the component render body causes redundant iterations and O(N*M) performance bottlenecks, especially when calculating derived statistics.
**Action:** Consolidate these iterations into a single `.reduce()` pass and use a `Map` for O(1) lookups. Wrap this logic in a `useMemo` hook to avoid recalculating on every re-render and maintain stable references.
