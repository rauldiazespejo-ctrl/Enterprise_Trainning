## 2024-05-19 - Replace O(N*M) lookups with O(N) Maps in React Renders
**Learning:** In React components dealing with related data (e.g., users, courses, assignments), performing `Array.prototype.find()` inside an `Array.prototype.map()` creates an O(N*M) performance bottleneck that runs synchronously during every render.
**Action:** When enriching lists with relational data in React, construct an O(N) `Map` wrapped in `useMemo` for the reference data, and then perform O(1) `.get()` lookups when mapping over the target data. Ensure the resulting list is also wrapped in `useMemo`.
