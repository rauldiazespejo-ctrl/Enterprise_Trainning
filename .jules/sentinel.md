## 2026-09-05 - Prevent SSRF in Supabase Edge Functions with standard fetch API
**Vulnerability:** Server-Side Request Forgery (SSRF) allowed calling internal IPs or bypassing protections using DNS rebinding or redirects.
**Learning:** Using the standard `fetch` API in Deno doesn't prevent access to internal IPs by default. When mitigating SSRF via DNS rebinding checking (resolving the hostname before fetch), using `{ redirect: 'manual' }` doesn't expose the location header properly due to `opaqueredirect` rules, making it impossible to check where the redirect goes.
**Prevention:** Configure the fetch options with `{ redirect: 'error' }` to abort the request entirely if a malicious redirect to an internal IP is attempted. Use `Deno.resolveDns` combined with a strict private IP regex check for initial hostnames and normalize user input with `new URL()`.
## 2024-05-18 - Prevent SSRF with IPv6 DNS Rebinding in Edge Functions
**Vulnerability:** A DNS rebinding vulnerability could be bypassed via IPv6 addresses when only IPv4 (`A` records) were validated during pre-flight DNS checks.
**Learning:** Using `Deno.resolveDns` requires explicit checks for both `A` and `AAAA` records, as attackers can specify IPv6 loopback (`::1`) or private equivalent addresses directly via DNS to bypass IPv4 validation.
**Prevention:** Ensure DNS rebinding checks query both IPv4 and IPv6, blocking requests that resolve to private or loopback ranges for both versions before proceeding with the fetch.
