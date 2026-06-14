## 2026-06-14 - Header Accessibility Improvements
**Learning:** Icon-only buttons and generic inputs in the main navigation header (`src/components/layout/Header.tsx`) were missing ARIA labels, which degrades screen reader accessibility in Spanish.
**Action:** Always add contextually appropriate Spanish `aria-label` attributes to icon-only buttons (`Abrir menú`, `Notificaciones`) and search inputs (`Buscar`) using existing accessible patterns without altering visual styles.
