## 2024-05-18 - Single-Pass Map Lookups

**Learning:** When generating complex UI states in React components (like dashboards), iterating through an array sequentially with `.filter()` multiple times, or doing nested `.find()` searches within a `.map()`, creates hidden `O(N*M)` or `O(k*N)` bottlenecks that scale poorly.

**Action:** Consolidate data transformation pipelines into a single `useMemo` block. Build an `O(1)` Map for related entities (like users or courses) prior to iteration, and use a single `.reduce()` or map pass to aggregate multiple counts/filtered-lists at once, dropping the complexity to `O(N + M)`.
