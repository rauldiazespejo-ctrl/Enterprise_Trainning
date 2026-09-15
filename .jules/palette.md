## 2024-05-18 - Missing ARIA Labels on Administrative Action Buttons
**Learning:** Found multiple icon-only buttons (promote, demote, reset password, refresh) in the SuperAdmin panel missing `aria-label`s, which makes them inaccessible to screen readers. Relying solely on `title` attributes is insufficient. Also, these buttons lacked the `focus-ring` class for visible keyboard focus indication.
**Action:** Always add descriptive `aria-label`s in Spanish and append `focus-ring` utility class to icon-only buttons for both screen reader context and keyboard accessibility.
