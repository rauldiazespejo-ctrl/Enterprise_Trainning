## 2024-06-17 - [Modal Accessibility]
**Learning:** Found an accessibility issue pattern specific to this app's components, where core reusable UI components like `Modal` lack proper ARIA labels and keyboard focus states on icon-only buttons.
**Action:** When working on UI components, ensure to always add `aria-label` to icon-only buttons and implement visible keyboard focus states (e.g., `focus-visible:ring-2`) to ensure screen reader accessibility and keyboard navigation.
