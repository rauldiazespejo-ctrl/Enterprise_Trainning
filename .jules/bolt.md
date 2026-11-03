## 2024-11-03 - O(N*M) Anti-pattern in React Render
**Learning:** Using a context helper (like `getUserAssignments`) inside an array traversal (like `employees.reduce()` or `employees.filter()`) during render creates an O(N*M) performance bottleneck, as it repeatedly scans the underlying data (like `assignments`).
**Action:** Consolidate multiple O(N) array traversals into a single O(N) `.reduce()` pass over the raw data to build a frequency map, wrap the result in `React.useMemo`, and replace the expensive function with O(1) object lookups.
