## 2024-07-11 - Optimize assigned courses calculation
**Learning:** React component derived state computations with `filter()` and `find()` over O(N) arrays can lead to excessive re-computations and O(N*M) bottlenecks during renders if not memoized, particularly in core dashboard views.
**Action:** Always wrap expensive list aggregations and derived computations in `useMemo()` to avoid blocking the main thread and maintain O(1) rendering.
