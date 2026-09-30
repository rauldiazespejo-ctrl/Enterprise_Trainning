## 2024-09-30 - Pagination Playwright Testing
**Learning:** When writing Playwright visual verification scripts for pagination controls with an ellipsis feature, target elements (like 'Page 5') might be hidden depending on the current page context.
**Action:** Always interact with immediately adjacent pages (e.g., 'Next' or page 3 from page 2) rather than distant page numbers to prevent test execution timeout failures caused by hidden elements.
