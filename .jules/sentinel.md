## 2024-05-31 - [Missing Authentication in Audit Log]
**Vulnerability:** The Supabase Edge Function `audit-log` does not enforce strict authentication checks.
**Learning:** This function is sometimes called during unauthenticated events (like failed logins).
**Prevention:** If enforcing auth, handle expected unauthenticated scenarios carefully.

## 2024-05-31 - [SSRF in Edge Functions]
**Vulnerability:** The Supabase Edge Function `scrape-url` accepted an arbitrary `url` in its payload and passed it directly to `fetch()` without any validation of the protocol or hostname. This permitted Server-Side Request Forgery (SSRF).
**Learning:** Edge Functions fetching external resources must implement strict SSRF protection to prevent scanning of internal services.
**Prevention:** Always parse untrusted URLs and validate that the protocol is HTTP/HTTPS and the hostname is not pointing to loopback (127.0.0.0/8), private (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), or null networks (0.0.0.0).
