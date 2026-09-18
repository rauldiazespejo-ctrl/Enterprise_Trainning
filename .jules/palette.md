## 2024-05-24 - Accessible Slide Indicators
**Learning:** Carousel dot indicators must provide structural context and state information to screen readers. Simply rendering `<button>` elements creates an ambiguous UI for non-visual users.
**Action:** When implementing custom dot indicators or carousels, always wrap them in a container with `role="group"` and an `aria-label`, and ensure each button has a descriptive `aria-label` (e.g., "Ir a la diapositiva X") and sets `aria-current="true"` on the active item.
