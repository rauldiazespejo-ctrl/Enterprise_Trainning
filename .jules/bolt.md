## 2024-05-18 - Optimize global states calculation without O(N*M)
**Learning:** Re-executing filtering calls across large datasets without memorization drastically impacts render cycle performance in this specific component where context methods are used repeatedly per employee.
**Action:** Use `React.useMemo` along with pre-calculated O(1) maps, and consolidate iterative processes like mapping filtering elements inside a single `.reduce()` pass.
