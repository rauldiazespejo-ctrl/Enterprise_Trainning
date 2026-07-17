## 2024-05-24 - O(N*M) lookups inside Maps
**Learning:** Be careful with context getters. Sometimes context helpers like \`getUserAssignments\` simply wrap a \`.filter\` over a flat array. In these cases, to optimize O(N*M) components, it is necessary to bypass the helper and group the flat array using a Map in a single \`useMemo\` pass, to avoid the O(N*M) time complexity trap.
**Action:** Always verify if a getter does any hidden logic before bypassing it. If it doesn't, grouping the flat array using a Map is the right choice.
