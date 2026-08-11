## 2025-08-11 - Fixed broken useMemo memoization in EmployeeManagement.tsx
**Learning:** When memoizing derived arrays like `const employees = users.filter(...)`, ensure the derived array itself is memoized before using it as a dependency in another `useMemo`. Otherwise, the array reference changes on every render, causing the dependent `useMemo` to recalculate every time, defeating its purpose.
**Action:** Wrap intermediate derived arrays in `useMemo`, or refactor the dependent `useMemo` to rely directly on the original state arrays.
