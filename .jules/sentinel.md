## 2024-10-02 - Fix IDOR in audit-log
**Vulnerability:** In `audit-log` edge function, `user_id` was taken directly from the request body without verifying it against the authenticated user's session token.
**Learning:** `user_id` should be obtained from the `Authorization` header securely via `supabase.auth.getUser()`, allowing unauthenticated actions to pass.
**Prevention:** Always overwrite `user_id` from the secure context when using the `SUPABASE_SERVICE_ROLE_KEY`.
