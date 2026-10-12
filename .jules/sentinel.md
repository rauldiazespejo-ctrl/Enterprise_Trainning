## 2024-10-12 - IDOR / Spoofing in Audit Log Function

**Vulnerability:** The `audit-log` edge function relies on the `user_id` provided directly in the request body payload and uses the `SUPABASE_SERVICE_ROLE_KEY` to insert the log into the database without enforcing RLS or validating the user. This allows any user to spoof audit logs for other users by simply altering the `user_id` in the request body.

**Learning:** When bypassing RLS with `SUPABASE_SERVICE_ROLE_KEY` in Edge Functions, we must explicitly verify the user's `Authorization` header rather than trusting unauthenticated input. Unauthenticated actions (like login, login_failed) are an exception and need to fall back to the body payload.

**Prevention:** To prevent IDOR, always fetch and overwrite the `user_id` with `user.id` obtained securely from the `Authorization` header via `supabase.auth.getUser()`, unless explicitly handling unauthenticated actions.
