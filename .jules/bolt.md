## 2026-08-09 - Optimized employee stats calculation
**Learning:** In EmployeeManagement.tsx, calculating stats for each employee within an O(N) `.reduce()` loop by filtering the entire assignments/certificates arrays inside a helper function (`employeeStats`) results in an O(N*M) performance bottleneck, especially as the number of users and assignments grows.
**Action:** Bypassed the context helper function and directly grouped the underlying flat arrays (`assignments` and `certificates`) using a Map in a single `useMemo` pass to achieve O(1) lookups for each employee's stats.
