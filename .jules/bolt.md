## 2024-05-18 - Optimized employee stats calculation
**Learning:** Found an O(N*M) nested loop inside an O(N) array calculation in `EmployeeManagement.tsx` which causes extreme lag when tracking learning metrics. `getUserAssignments` abstracts a simple O(N) array filtering.
**Action:** Consolidate these arrays directly inside `useMemo` using a `Map` structure mapping `employeeId` to `stats` inside the render cycle to transform lookups into O(1), improving iteration complexity from O(N*M) down to O(N+M).
