## 2024-05-15 - Spoofing via Unauthenticated Edge Function Payloads
**Vulnerability:** The `audit-log` edge function used the `SUPABASE_SERVICE_ROLE_KEY` to write to the database (bypassing RLS) and trusted the `user_id` provided directly in the request JSON payload.
**Learning:** This allowed any client (or unauthenticated user) to forge audit events and spoof actions as other users, as there was no validation that the caller actually owned that `user_id`.
**Prevention:** Always extract the authenticated user securely from the `Authorization` header via `supabase.auth.getUser()` inside Edge Functions before using a service role key. Do not trust client-provided user IDs for sensitive operations.
