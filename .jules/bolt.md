## 2026-06-15 - Code Splitting Routes
**Learning:** The React application loads all pages synchronously in App.tsx resulting in a large initial bundle size. By default all routes were packaged into the main chunk affecting initial load time.
**Action:** Replaced static imports with React.lazy and Suspense for all route components to enable code splitting. This allows Vite/Rollup to generate separate chunks for each route, improving initial load time significantly.
