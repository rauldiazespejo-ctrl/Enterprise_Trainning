## 2024-10-24 - Optimize multiple sequential array operations
**Learning:** In React components like `EmployeeDashboard`, performing multiple sequential `.filter()` operations on the same large derived array on every render cycle scales poorly (O(N) operations multiplying based on number of statuses checked).
**Action:** Consolidate these repeated array iterations into a single `.reduce()` pass wrapped in a `useMemo()` hook to calculate all derived statistics in O(N) time and maintain a stable object reference across re-renders.
