## 2024-07-27 - Pagination Accessibility
**Learning:** Adding the appropriate `aria-live`, semantic `nav` elements, and explicit `aria-hidden` tags makes custom UI components significantly more accessible for assistive technology without modifying base logic.
**Action:** Always wrap pagination components in a `<nav aria-label="Navegación de páginas">`, use `aria-live="polite"` on summary text ("Mostrando X-Y de Z"), and apply `aria-current="page"` to the active page button. Ensure decorative icons/ellipses are `aria-hidden="true"`.
