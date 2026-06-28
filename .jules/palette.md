## 2024-06-28 - Automatic ID Generation for Form Controls
**Learning:** Hardcoded or missing IDs in reusable UI form components (like `Input` and `Select`) lead to broken `<label>` associations and inaccessible error messages when multiple instances are rendered.
**Action:** Always use React's `useId()` hook internally within generic form components to automatically generate unique fallback IDs, ensuring robust `<label>` linking and `aria-describedby` error associations without requiring developers to manually pass an `id` prop.
