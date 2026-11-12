## 2025-02-24 - O(N*M) Nested Array Lookups inside React renders
**Learning:** Found O(N*M) time complexity due to nested `Array.prototype.find()` calls inside `.map()` arrays being computed during synchronous React renders. This can block the main thread, especially when inputs triggering re-renders (like search bars) are typed into frequently.
**Action:** Always replace `Array.prototype.find()` nested inside `.map()` with an O(1) `Map` lookup and wrap the derived computation in a `useMemo()` hook to prevent recalculation on every render.
