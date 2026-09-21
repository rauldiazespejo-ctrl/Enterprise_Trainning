## 2026-09-21 - Insecure Direct Object Reference (IDOR) in Audit Logging
**Vulnerability:** The `audit-log` Supabase Edge Function trusted the `user_id` provided in the request body for attributing audit events, allowing malicious clients to spoof actions as other users.
**Learning:** Even internal-facing API endpoints must re-verify authentication context from trusted tokens (JWTs) when dealing with sensitive attribution, rather than trusting unverified payload properties.
**Prevention:** Always extract user identity directly from the `Authorization` header via `auth.getUser()` in Edge Functions instead of relying on client-provided body parameters.
