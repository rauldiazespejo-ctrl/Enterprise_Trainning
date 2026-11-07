## 2024-11-07 - Insecure Direct Object Reference in Audit Log
**Vulnerability:** IDOR vulnerability in the `audit-log` edge function where it trusted the `user_id` provided directly in the request body instead of validating it against the session.
**Learning:** This occurred because the function simply took the `user_id` directly from the payload without verifying the user identity from the `Authorization` header JWT via `auth.getUser()`.
**Prevention:** Always extract user identity securely on the server-side from the authenticated JWT token for sensitive operations (unless it's an exempt action like logout where the token might already be invalidated). Never trust client-provided user IDs.
