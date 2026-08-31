## 2024-05-24 - Optimizing EmployeeDashboard render loop
**Learning:** React components sometimes filter and map large arrays continuously on every render (e.g. `EmployeeDashboard.tsx` extracting courses and progress manually without `useMemo`).
**Action:** Always wrap expensive derived calculations from global state with `useMemo` so that they do not get recalculated on every render, especially when dealing with lists and status filtering.
