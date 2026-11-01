## 2024-03-24 - Performance Optimizations
**Learning:** Performance optimizations should focus on measurable impact and clean execution.
**Action:** Always verify with `pnpm check` and document impact.

## 2024-03-24 - Performance Optimizations
**Learning:** Calling context helper functions (like `getUserAssignments`) inside a loop during render is an O(N*M) anti-pattern.
**Action:** Process the full raw array directly in a single pass (e.g., `assignments.reduce(...)`) to build a frequency map, and memoize the result to achieve O(N+M) complexity. Ensure all locally derived arrays passed into the dependency array are also memoized.
