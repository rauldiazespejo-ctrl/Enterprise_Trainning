## 2024-05-30 - O(N*M) Map Lookup Overheads
**Learning:** Found several places where `.map()` iterates over arrays and does a `.find()` inside for every item. This is an O(N*M) operation which can degrade performance significantly as lists grow.
**Action:** Use a `useMemo` hook to build a `Map` lookup outside the array iteration, turning the complexity to O(N+M) prior to mapping.
