## 2024-10-26 - IDOR Vulnerability in Edge Function

**Vulnerability:** The `audit-log` edge function was accepting a user-supplied `user_id` from the request JSON body to log user actions. An attacker could tamper with this property and log malicious actions on behalf of other users (IDOR).
**Learning:** The vulnerability existed because edge functions often have a "service role key" execution context (bypassing RLS), relying solely on the application frontend logic to send the correct payload instead of enforcing authentication verification at the edge.
**Prevention:** Always authenticate the user at the edge level using the incoming `Authorization` header and securely extract the `user.id` from the validated JWT token. If the endpoint requires unauthenticated access (e.g., login failure logs), use a fail-closed whitelist of allowed actions; otherwise, explicitly throw an `Unauthorized` error.
