## 2025-03-09 - Avoiding react-hooks/exhaustive-deps with Map lookups
**Learning:** When optimizing O(N*M) nested array lookups into O(1) Map lookups using `useMemo` in React, calling an external helper function to access the Map (e.g. `employeeStats(id)`) inside other hooks or reducers triggers ESLint `react-hooks/exhaustive-deps` warnings.
**Action:** Instead of wrapping the Map lookup in a helper function, access the values directly from the Map inline (e.g. `statsMap.get(id)?.value || fallback`) within the dependent computations.
