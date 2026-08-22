## 2024-05-24 - Missing Memoization in Admin Pages
**Learning:** React re-renders in admin panels (EmployeeManagement, AssignmentManagement) can be very expensive if arrays like `employees`, `filteredEmployees`, `publishedCourses` and aggregations like `stats` or `enrichedAssignments` are not memoized with `useMemo`. When any state like `searchTerm` changes, everything re-computes.
**Action:** Always wrap derived data calculations in `useMemo` in list/management components to avoid O(n) or O(n^2) re-computations on every keystroke.
