## 2023-10-21 - Optimizing O(N*M) React Context Helper Anti-Pattern
**Learning:** Using context helper functions (like `getUserAssignments`) inside a loop or `.reduce()` during a render cycle causes an O(N*M) performance penalty, as it filters the entire raw array for each item in the loop.
**Action:** Consolidate O(N*M) nested iterations by computing global aggregate statistics using a single `.reduce()` pass over the raw array to build a frequency map, and memoize the result with `useMemo` for O(N+M) complexity and O(1) lookups.
