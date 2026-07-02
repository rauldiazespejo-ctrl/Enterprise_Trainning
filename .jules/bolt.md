## 2025-03-01 - O(N²) array lookups in React mapping

**Learning:** When derived data relies on related collections (e.g. computing aggregate stats for each user by searching through `assignments` and `certificates`), filtering those collections repeatedly inside a mapped render loop leads to an O(N * (M+K)) operation synchronously blocking the main thread on every re-render (such as search bar filtering), potentially freezing the UI.
**Action:** Always extract O(N) array filtering out of render `.map()` loops. Instead, pre-compute an aggregated lookup `Map` inside a single `useMemo` that traverses the related arrays exactly once, producing an O(1) stats lookup per row and improving overall complexity to O(N+M+K).
