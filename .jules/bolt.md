## 2024-05-18 - Replacing O(N*M) Map Filtering in React
**Learning:** In heavily nested operations like `employeeStats` in `EmployeeManagement.tsx` where an array is filtered multiple times per mapped item (e.g., getting assignments per employee), it creates an O(N*M) bottleneck.
**Action:** When calculating derived stats from arrays, group them first into a Map in a single O(N) pass using `useMemo`, allowing O(1) lookups during the render phase.
