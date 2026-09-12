## 2026-09-12 - Optimize O(N^2) React Array Operations
**Learning:** When building admin tables with derived strings and stats, chaining `.map().filter()` containing `.find()` lookups inside functional components causes massive O(N*M) bottlenecks that re-execute on every keystroke (like a search input).
**Action:** Use a single `.reduce()` block inside `useMemo` and build O(1) `Map` lookup tables beforehand. Fast-fail direct filters before performing string enrichments.
