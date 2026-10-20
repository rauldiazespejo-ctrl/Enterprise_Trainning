## 2024-03-24 - Paginator A11y Semantic HTML
**Learning:** React generic div blocks fail to signal semantic structure. By wrapping pagination components inside a <nav> block explicitly marked with aria-label="Pagination" (or similar), and by using aria-current="page" along with specific page aria-labels, we strongly clarify to screen readers not only what the controls are but also where the user is currently located.
**Action:** Always wrap pagination components in a <nav aria-label="..."> and set aria-current="page" on the active item, along with explicit individual element aria-labels.
