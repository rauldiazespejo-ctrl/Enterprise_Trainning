## 2024-07-07 - AssignmentManagement Array Search Optimization
**Learning:** Performing `Array.find` lookups inside `.map` or `.filter` iterations causes O(N^2) complexity and significantly blocks the main thread during simple user inputs like searching.
**Action:** Always map the reference data into an O(1) `Map` object and use `.get()` to pull properties inside iterations.
