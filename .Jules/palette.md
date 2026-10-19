## 2024-10-19 - Pagination Accessibility
**Learning:** The pagination component lacked proper structural context and state communication for assistive technologies.
**Action:** Next time, always wrap pagination controls in a semantic <nav aria-label="..."> element, provide individual aria-labels and aria-current state for page buttons, and hide decorative elements like ellipses using aria-hidden="true".
