## 2024-03-24 - Optimizing Assignment Management

**Learning:** When dealing with multiple filtering criteria and enriched data (mapping user IDs to user objects and course IDs to course objects) in React components, combining the filtering and the joining (map + find) within the same render cycle causes an O(N*M) performance penalty, where N is the number of assignments and M is the number of users/courses. `enrichedAssignments = assignments.map(a => { users.find(); courses.find() })` creates significant overhead as assignments grow.

**Action:** Consolidate array manipulation for derived state (filtering and joining) into a single `.reduce()` pipeline. Pre-compute O(1) Lookup Maps (`new Map()`) for users and courses before iterating over assignments to change the time complexity to O(N + M). Wrap this entire transformation pipeline in `useMemo` so it only re-executes when the source data or active filters actually change.
