## 2024-05-15 - React Hook Dependency Chain Breakage
**Learning:** When passing locally derived arrays (like an inline `.filter()`) into the dependency array of a `useMemo` hook, the `useMemo` will silently break and re-execute on every render because the inline `.filter()` creates a new array reference each time. This completely negates the performance benefit.
**Action:** Always memoize the derived arrays (e.g. `const employees = useMemo(() => users.filter(...), [users])`) before passing them as dependencies to other hooks to preserve the reference across renders.
