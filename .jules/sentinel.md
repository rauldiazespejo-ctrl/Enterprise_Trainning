## 2025-02-21 - [SSRF Protection with Deno fetch]
**Vulnerability:** The URL scraping Edge Function used raw `fetch` directly on user input without any DNS or IP validation, making it vulnerable to Server-Side Request Forgery (SSRF) targeting internal services or cloud metadata.
**Learning:** Native `fetch` API doesn't have built-in SSRF protections or hooks for custom DNS resolution binding, leaving it vulnerable to DNS rebinding attacks and requiring manual redirect loop handling.
**Prevention:** Always implement a custom `fetch` wrapper (like `safeFetch`) that manually resolves and validates IPs via `Deno.resolveDns`, disallows local ranges, handles redirects manually, and explicitly fails closed on DNS errors.
