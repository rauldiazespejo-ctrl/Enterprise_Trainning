## 2024-05-18 - [CRITICAL] SSRF in scrape-url Supabase Edge Function
**Vulnerability:** The `scrape-url` Supabase Edge Function accepted arbitrary URLs and directly fetched them. An attacker could provide internal or loopback IP addresses (like `127.0.0.1` or `169.254.169.254`), or use DNS rebinding attacks on standard hostnames, forcing the server to issue requests to internal services or metadata endpoints. Additionally, redirect locations were blindly followed, allowing bypasses.
**Learning:** SSRF mitigation with the standard `fetch` API is difficult due to inherent TOCTOU (Time-of-Check to Time-of-Use) issues, as `fetch` does its own DNS resolution, meaning a malicious hostname could resolve to a safe IP during validation but swap to an internal IP during the actual fetch. Standard fetch also defaults to following redirects.
**Prevention:**
1. Validate protocols (HTTP/HTTPS only).
2. For IPs or hostnames, validate against RFC 1918 (private), loopback, link-local, and specific internal domains (like cloud metadata IPs).
3. If it's a hostname, perform pre-flight validation using `Deno.resolveDns` to ensure it doesn't resolve to a private IP, though this is a best-effort mitigation against DNS rebinding.
4. Set `{ redirect: 'manual' }` in `fetch` to intercept redirects. Validate the `Location` header URL exactly like the initial URL before following it.
5. In TypeScript, error objects in catch blocks are `unknown`. Checking `error instanceof Error` is required before accessing `error.message`.
