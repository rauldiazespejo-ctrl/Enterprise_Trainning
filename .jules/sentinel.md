## 2025-03-08 - Fix IDOR in audit log edge function by extracting user_id securely from JWT
**Vulnerability:** IDOR vulnerability in `audit-log` edge function allowing users to pass arbitrary `user_id` values in the request body.
**Learning:** Extracting `user_id` purely from the request body in an edge function is insecure. However, completely failing on missing JWT drops context for exempt actions like `logout` or `login_failed`.
**Prevention:** Implement a fail-closed mechanism for non-exempt actions, throwing an Unauthorized error if auth is missing or invalid. Use the request body as a fallback to extract `user_id` for exempt actions (where a valid JWT might be absent) to avoid dropping the audit trail.
