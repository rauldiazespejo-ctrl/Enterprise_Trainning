1. **Optimize EmployeeStats calculation in `EmployeeManagement.tsx`**
   - The current implementation of `employeeStats` uses O(N*M) time complexity as it runs `getUserAssignments` and `certificates.filter` inside the `paginatedEmployees.map` function, and also `totalCompleted` and `totalInTraining` reduce/filter loops over all employees.
   - We will replace it with a `useMemo` block to calculate `employeeStatsMap` returning an O(1) hash map lookup.

2. **Replace helper function with `React.useCallback`**
   - Refactor `employeeStats` to `React.useCallback` that looks up data from the `employeeStatsMap`. Include `employeeStatsMap` in the dependency array.

3. **Verify the change**
   - Run `pnpm check && pnpm test` to ensure tests and type checking pass.

4. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done**
