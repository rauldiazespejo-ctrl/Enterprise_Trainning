
## 2024-05-18 - Missing ARIA Labels on Icon-only Buttons
**Learning:** Found multiple instances of icon-only buttons (like those using `lucide-react` icons) in `SuperAdminPanel.tsx` lacking `aria-label`s, which makes them inaccessible to screen readers. They used `title` attributes instead.
**Action:** Added context-aware `aria-label`s in Spanish to these buttons, along with `aria-hidden="true"` on the decorative SVG icons themselves, to ensure they are properly announced to assistive technologies without redundant information.
