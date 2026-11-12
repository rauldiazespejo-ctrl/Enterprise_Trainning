## 2025-02-28 - Automatic ID generation for form accessibility
**Learning:** Reusable UI components like Input and Select often break accessibility when developers forget to pass unique `id` props, resulting in unlinked labels and form fields.
**Action:** Always use `React.useId()` to provide a robust fallback ID for form controls. This ensures `htmlFor`, `id`, `aria-invalid`, and `aria-describedby` are automatically wired up correctly, making components accessible by default without requiring manual developer intervention.
