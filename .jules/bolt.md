## 2025-02-28 - [Memoize List Processing for Employee Management]
**Learning:** O(N) operations in `src/pages/admin/EmployeeManagement.tsx` (`filter`, `reduce`, etc.) should be wrapped in `useMemo` and functions like `employeeStats` in `useCallback` to prevent unnecessary recalculations on each render.
**Action:** When working on lists inside React components, check for missing `useMemo` or `useCallback` on derived values and helper functions.
