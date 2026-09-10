## 2024-05-15 - SSRF Vulnerability in fetch calls
**Vulnerability:** Server-Side Request Forgery (SSRF) allowed access to internal/private IPs and cloud metadata endpoints via the `scrape-url` Supabase Edge Function since it blindly passed user input to `fetch`.
**Learning:** `fetch` inherently follows redirects and doesn't validate if resolved IPs are internal. Also, validating via `Deno.resolveDns` before fetching still leaves a Time-Of-Check to Time-Of-Use (TOCTOU) vulnerability because the DNS resolution during `fetch` could yield a different (internal) IP via DNS rebinding. Replacing the hostname with the resolved IP breaks HTTPS Server Name Indication (SNI).
**Prevention:**
1. Use `new URL()` to parse user input and validate protocol (`http:` / `https:`).
2. Manually resolve DNS for both 'A' and 'AAAA' records (`Deno.resolveDns`) and block internal IP ranges using strict exact regexes.
3. Configure `fetch` with `{ redirect: 'manual' }`.
4. Manually loop through redirects up to a reasonable limit, re-validating the `Location` header URL at each hop.
5. Always call `res.body?.cancel()` for discarded redirect responses to prevent resource leaks.
6. Acknowledge that this approach in Deno still has a TOCTOU limitation, which can only be fully mitigated with specialized proxying or HTTP clients supporting custom SNI injection with pinned IPs.
