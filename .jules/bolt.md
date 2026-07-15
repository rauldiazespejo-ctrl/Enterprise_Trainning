## 2025-07-15 - Refactor O(N²) array lookups in renders
**Learning:** Found an O(N*M) performance bottleneck specific to how nested iterations (`.find()` inside `.map()`) were recalculating during renders inside list management components (AssignmentManagement, CertificateManagement, EmployeeDashboard).
**Action:** Replaced `.find()` with precomputed `useMemo` backed `Map` lookups, dropping time complexity from O(N*M) to O(N+M). Applied inline codebase-specific performance comments (⚡ Bolt Optimization) explicitly describing the improvement logic.
