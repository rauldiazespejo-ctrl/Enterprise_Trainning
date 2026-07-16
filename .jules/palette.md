## 2024-07-06 - Active State Accessibility for Interactive Indicators
**Learning:** Visual indicators like dot indicators (SlideViewer), image thumbnails (SlideCards), and page numbers (Pagination) in this app were missing attributes to communicate their state and purpose to screen readers.
**Action:** Always add descriptive `aria-label`s (e.g., "Diapositiva 1", "Página 1") and dynamically apply `aria-current="step"` or `aria-current="page"` to indicate the currently active element in these sequential or paginated lists.
