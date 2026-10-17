## 2024-05-24 - Missing ARIA labels on Icon-Only Buttons
**Learning:** Critical icon-only action buttons (like refresh or show password) were missing accessible names, making their function opaque to screen reader users.
**Action:** Always verify icon-only buttons have an explicit aria-label attribute if they lack visible text or a fallback.
