## 2026-06-25 - [Robust Form Label Associations with useId]
**Learning:** Relying on developers to manually pass `id` props to custom form components (`Input`, `Select`) often leads to missing `htmlFor` mappings, breaking screen reader associations. Furthermore, inline error messages need explicit `aria-describedby` linkage to be announced properly.
**Action:** Use React's `useId()` hook as a fallback in base form components to guarantee every field has a unique ID, automatically associating labels and `aria-describedby` error elements even when an explicit `id` isn't provided.
