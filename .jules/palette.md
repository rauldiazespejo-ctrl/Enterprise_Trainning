
## 2023-10-27 - Unique ID generation for Input & Select components
**Learning:** Found that custom `Input` and `Select` components lacked dynamic unique IDs, making it hard to robustly link `<label>`s to form controls using `htmlFor` when multiple instances exist on the same page.
**Action:** Used React's `useId()` hook to automatically generate unique, stable IDs internally for these components if an explicit `id` is not provided. This ensures screen readers can correctly associate labels with their inputs without developers needing to manually manage IDs.
