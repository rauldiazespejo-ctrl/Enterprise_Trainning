## 2024-09-02 - O(N*M) Nested Lookups in Render
**Learning:** Sequential array `.find()` calls inside `.map()` or `.filter()` loops within React components cause an O(N*M) time complexity bottleneck. If unmemoized, this recalculates on every render (e.g. typing in a search box).
**Action:** Replace nested `.find()` with O(1) Map lookups built outside the loop, combine mapping and filtering using `.reduce()`, and wrap the entire calculation in `useMemo` to achieve O(N+M) complexity and prevent expensive re-renders.
