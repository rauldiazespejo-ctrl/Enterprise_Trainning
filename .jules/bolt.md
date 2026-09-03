## 2024-09-03 - Optimizing Derived Statistics with useMemo, Map, and reduce

**Learning:** When calculating multiple derived statistics (e.g., filtered arrays, counts, first elements) from a relational dataset (like assignments referencing courses) inside a React render loop, chaining `.map()`, `.filter()`, and `.find()` causes O(N*M) lookups and redundant iterations. This is especially slow if the source arrays are large and update frequently.

**Action:** Consolidate these operations into a single `useMemo` pass. First, create a `Map` from the lookup array (e.g., courses) for O(1) retrieval. Then, use a single `.reduce()` over the main array (e.g., assignments) to simultaneously build all derived arrays and counts in O(N+M) time complexity. Ensure all dependencies are correctly listed in the `useMemo` dependency array.
