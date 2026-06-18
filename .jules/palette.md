## 2024-06-16 - Accessibility in Authentication Flow
**Learning:** Found that custom-styled forms in the authentication flow were missing essential input-label associations (`htmlFor` -> `id`) and that icon-only interactive elements (like the password visibility toggle) lacked `aria-label`s, rendering them opaque to screen readers.
**Action:** Always verify that every `<label>` has a matching `htmlFor` pointing to its `<input id="...">`, and ensure all icon-only buttons receive descriptive, context-aware `aria-label` attributes.
