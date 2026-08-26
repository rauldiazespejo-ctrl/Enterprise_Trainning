## 2024-05-18 - Semantic Pagination Structure
**Learning:** Using a simple `<div>` for pagination containers leaves screen reader users without structural context, making it hard to identify the purpose of the number buttons.
**Action:** Always wrap pagination controls in a `<nav aria-label="Navegación de páginas">` and ensure dynamic text like "Mostrando 1-10" uses `aria-live="polite"`.
