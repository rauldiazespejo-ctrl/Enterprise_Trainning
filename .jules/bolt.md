## 2024-03-20 - Optimizing Array Lookups in Admin Lists
**Learning:** Admin management pages often involve cross-referencing multiple large arrays (e.g., assignments, users, courses). Performing `.find()` inside `.map()` creates O(N*M) time complexity which causes noticeable lag during filtering/searching as the dataset grows.
**Action:** When calculating derived lists from multiple arrays, always build O(1) Map lookups first and wrap the entire transformation (mapping and filtering) inside a single `useMemo` pass to avoid redundant recalculations.
