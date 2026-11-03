1. **Modify `src/pages/admin/EmployeeManagement.tsx` to optimize `employeeStats` calculation:**
   - Use `replace_with_git_merge_diff` to remove `getUserAssignments` from `useCourses` destructuring at line 46.
2. **Verify removal of `getUserAssignments`:**
   - Use `run_in_bash_session` to run `sed -n '40,55p' src/pages/admin/EmployeeManagement.tsx` to verify the removal of `getUserAssignments`.
3. **Modify `src/pages/admin/EmployeeManagement.tsx` to implement `employeeStatsMap`:**
   - Use `replace_with_git_merge_diff` to wrap `employees` with `React.useMemo`, add `employeeStatsMap` with `React.useMemo`, and refactor `employeeStats` with `React.useCallback`.
4. **Verify the changes:**
   - Use `run_in_bash_session` to run `grep -n -B 5 -A 25 "employeeStatsMap" src/pages/admin/EmployeeManagement.tsx` to verify that the modifications in `src/pages/admin/EmployeeManagement.tsx` were correctly applied.
5. **Final test verification:**
   - Use `run_in_bash_session` to run `pnpm install && pnpm check` to ensure no regressions were introduced.
6. **Complete pre-commit steps:**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
7. **Submit the PR:**
   - Create a PR with title "⚡ Bolt: O(1) employee stats memoization" and description detailing the performance improvement. Include sections: '💡 What', '🎯 Why', '📊 Impact', and '🔬 Measurement'.
