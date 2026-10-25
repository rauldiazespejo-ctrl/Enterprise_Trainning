## 2023-10-25 - Avoid O(N*M) nested loops with frequency maps
**Learning:** Calling context helper functions that filter arrays inside loops during render creates an O(N*M) complexity anti-pattern, causing significant performance hits as the dataset grows.
**Action:** Instead of iterating directly and using a helper that filters an array for each item in a loop, process the full raw array directly in a single pass (e.g., `reduce(...)`) to build a frequency map. Memoize the result with `React.useMemo` to achieve O(N+M) complexity and prevent continuous recalculations.
