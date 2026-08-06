## 2024-05-24 - Unauthenticated Supabase Edge Function
**Vulnerability:** The `audit-log` Supabase Edge Function uses the service role key to insert records without verifying authentication or authorization from the caller, leading to a potential audit log spoofing vulnerability.
**Learning:** Edge Functions do not enforce authentication automatically. Without explicitly checking the caller's JWT, anyone can send requests to the edge function.
**Prevention:** Always require and validate the `Authorization` header in Edge Functions using `supabase.auth.getUser()` before performing privileged operations, or carefully rate-limit and restrict CORS if it truly needs to be unauthenticated.
## 2024-05-24 - SSRF vulnerability in Edge Function
**Vulnerability:** The `scrape-url` Edge Function accepts user-provided URLs and fetches them directly using `fetch()` without validating the URL protocol or hostname, allowing a Server-Side Request Forgery (SSRF) attack to query internal IP addresses or cloud metadata.
**Learning:** Deno's `fetch` follows user-supplied URLs verbatim. `new URL()` is required to normalize octal/hex IPs, check the protocol is HTTP/HTTPS, and validate the hostname to prevent SSRF in web scraping proxies.
**Prevention:** Always parse untrusted URLs using `new URL()`, restrict to `http:` and `https:`, and implement a strict explicit denylist for private, loopback, link-local, and cloud metadata hostnames.
