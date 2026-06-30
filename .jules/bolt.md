## $(date +%Y-%m-%d) - Memoize fallback object references

**Learning:** Returning inline object literals as fallbacks in `useCallback` or `useMemo` (e.g., `map.get(id) || { count: 0 }`) breaks referential equality for the returned value when the key is not found, triggering unnecessary re-renders in pure child components relying on that reference.
**Action:** Always declare fallback objects statically outside the component or with `useMemo` to ensure stable references across renders.
