## 2026-07-04 - Optimize Assignment Lookup Performance
**Learning:** Found O(N^2) array searching via `.find()` nested inside `.map()` directly inside the render loop in `AssignmentManagement.tsx`. This severely affects rendering performance during frequent state changes (like typing in a search bar).
**Action:** Replaced `.find()` lookups with `useMemo` and O(1) JavaScript `Map` structures to memoize the lookups across renders. Always convert reference arrays to `Map` objects with `useMemo` when performing multi-item mapping.
