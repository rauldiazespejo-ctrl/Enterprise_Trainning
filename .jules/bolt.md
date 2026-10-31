## 2024-03-24 - Optimize EmployeeManagement re-renders
**Learning:** Computing aggregate statistics via `employeeStats` (which calls context helpers like `getUserAssignments` that iterates) inside a loop across employees is O(N*M) and causes massive performance hits on each render.
**Action:** Replace `employeeStats` with a memoized O(1) map built from raw arrays (`assignments` and `certificates`) directly.
