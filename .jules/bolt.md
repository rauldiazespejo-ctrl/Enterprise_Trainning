## 2024-05-24 - O(N*M) Lookup Bottleneck in React Renders
**Learning:** Performing nested `Array.prototype.find()` inside array methods like `.map()` or `.filter()` during synchronous React renders creates an O(N*M) time complexity bottleneck. This can severely block the main thread and degrade the UI experience, especially on inputs that trigger frequent re-renders (like searching).
**Action:** Always convert O(N) linear array lookups inside list processing to O(1) Map lookups, and memoize the operations using `useMemo()` to prevent recalculations across non-dependent renders.
