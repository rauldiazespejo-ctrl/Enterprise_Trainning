## 2024-05-15 - Audit Log IDOR and Spoofing
**Vulnerability:** The `audit-log` edge function accepted a `user_id` from the unverified request body while using the `SUPABASE_SERVICE_ROLE_KEY` to insert records, leading to a spoofing/IDOR vulnerability.
**Learning:** Using service role keys bypasses RLS, so any user-provided identifiers must be explicitly validated against an authenticated session.
**Prevention:** Always overwrite unverified payload IDs with securely fetched IDs via `callerClient.auth.getUser()`, allowing deliberate exceptions only for non-authenticated events like `login_failed` or `logout`.
