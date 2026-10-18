## 2024-05-15 - IDOR in Audit Log
**Vulnerability:** The `audit-log` edge function was accepting `user_id` directly from the request body, allowing attackers to spoof audit logs for other users (IDOR).
**Learning:** Edge functions that handle mixed-context events must not trust user-provided IDs and must verify the caller's identity via JWT for authenticated actions, while allowing fallback for specific unauthenticated actions (like login).
**Prevention:** Always verify the authenticated user's JWT by instantiating a dedicated `callerClient` with the `SUPABASE_ANON_KEY` and the `Authorization` header, and overwrite the body's `user_id` with the securely obtained `user.id`.
