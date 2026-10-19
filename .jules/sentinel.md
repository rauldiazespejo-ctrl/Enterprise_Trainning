## 2024-10-19 - Insecure Direct Object Reference (IDOR) / Spoofing in Audit Log
**Vulnerability:** The `audit-log` edge function was accepting `user_id` blindly from the request body JSON to insert logs.
**Learning:** This implementation allowed any client to specify any user's ID, thereby spoofing actions as another user. Trusting client-supplied IDs for critical authorization and auditing without validation leads to IDOR vulnerabilities.
**Prevention:** In edge functions interacting with the database, extract the user identifier securely from the authenticated JWT via `Authorization` header rather than trusting payload bodies, except for inherently unauthenticated routes like login or signup.
