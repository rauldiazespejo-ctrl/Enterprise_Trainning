## 2024-05-18 - [SSRF Protection with Deno.resolveDns]
**Vulnerability:** Server-Side Request Forgery (SSRF) bypass due to naive string parsing.
**Learning:** String-based hostname validation for IP checks is insufficient as it cannot natively prevent DNS-based bypass vectors (like DNS rebinding or `.nip.io`).
**Prevention:** Always use `Deno.resolveDns(hostname, 'A')` and `Deno.resolveDns(hostname, 'AAAA')` to resolve actual IP addresses before validating them against private/local network ranges in Supabase Edge Functions.
