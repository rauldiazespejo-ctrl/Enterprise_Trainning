## 2024-06-20 - O(N*M) render-blocking derivation
**Learning:** Found nested O(N) array lookups (`users.find` and `courses.find`) inside `.map()` array derivations running synchronously on every render. With a growing dataset, this causes massive CPU spikes during user input events like typing in search bars.
**Action:** Always wrap derived lists in `useMemo`, and convert nested O(N) `.find()` lookups to O(1) Map/Record lookups to reduce complexity from O(N*M) to O(N+M).
