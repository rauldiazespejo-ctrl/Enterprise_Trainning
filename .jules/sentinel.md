## 2026-11-09 - SSRF Vulnerability in URL Fetching Edge Function
**Vulnerability:** The `scrape-url` Supabase edge function accepted user-provided URLs and fetched them using the built-in `fetch` API without validating if the destination IP address was internal or private. It also automatically followed redirects, allowing an attacker to bypass initial URL validation by providing a public URL that redirects to an internal resource.
**Learning:** In Deno/Supabase Edge Functions, `fetch` can inadvertently access private network resources (like internal APIs or metadata services) if not explicitly restricted. Relying solely on regex URL validation is insufficient because hostnames can resolve to internal IPs, and HTTP redirects can point to internal networks after the initial request is validated.
**Prevention:** To prevent SSRF when fetching user-provided URLs:
1. Implement a comprehensive `isPrivateIP` check (validating against `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, loopback, and IPv6 private ranges).
2. Resolve DNS for both 'A' and 'AAAA' records using `Deno.resolveDns` before making the request. Handle missing records correctly (e.g., catching errors for each query individually).
3. Disable automatic redirects by setting `redirect: 'manual'` in the `fetch` options.
4. Manually handle redirects (up to a limit), validating the target URL and its resolved IPs on every hop.
5. Ensure to explicitly cancel discarded responses (`await response.body.cancel()`) to prevent resource leaks during redirects.
