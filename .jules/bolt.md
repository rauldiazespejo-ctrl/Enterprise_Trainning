## 2024-07-21 - Memoize and optimize derived computations in EmployeeDashboard
**Learning:** Multiple synchronous array filtering (`filter`, `map`, `find`) and calling unmemoized context helpers (e.g., `getUserCertificates`) during the main render loop can cause significant O(N) or O(N*M) bottlenecks.
**Action:** Always wrap derived list computations in a `useMemo` hook, bypass unmemoized O(N) context helpers, and construct an O(1) Map for lookups to perform aggregations in a single pass.
