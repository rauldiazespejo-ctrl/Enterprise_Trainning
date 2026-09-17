## 2024-05-24 - Optimization of Nested Arrays
**Learning:** Found O(N*M) nested `.find()` iterations in `.map()` callbacks when enriching data arrays in list/management components (like `AssignmentManagement.tsx`).
**Action:** Replace these `.find()` operations inside iterations by constructing a lookup `Map` first using `useMemo`. This allows O(1) lookups during the main list transformation and prevents expensive O(N) recalculations on frequent state updates (like keystrokes in search inputs).
