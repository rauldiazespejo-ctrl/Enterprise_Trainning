## 2024-05-24 - Expensive Data Transformation During Render
**Learning:** Found O(N*M) nested array lookups (`.find()` inside `.map()`) inside render path for deriving `enrichedAssignments` state, along with multiple O(N) array filtering passes for calculating stats.
**Action:** Always construct `Map` lookups outside loops for O(1) lookups to reduce O(N*M) to O(N+M), consolidate sequential array passes like `.filter()` into a single `.reduce()` pass, and aggressively wrap these derived calculations in `useMemo` hooks, especially in admin panel components.
