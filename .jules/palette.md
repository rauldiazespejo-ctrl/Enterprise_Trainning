## 2025-03-05 - Auto-generate IDs for reusable form accessibility
**Learning:** Reusable form components like `Input` and `Select` often fail to associate `<label>` elements via `htmlFor` when developers forget or omit passing a unique `id` prop.
**Action:** Use React's `useId()` hook within custom form components to automatically generate unique fallback IDs, ensuring robust accessibility without relying on manual prop passing.
