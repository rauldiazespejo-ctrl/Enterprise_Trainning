## 2025-02-12 - SSRF mitigation in edge function with redirect handling
**Vulnerability:** The `scrape-url` Supabase Edge Function lacked SSRF protections, which could allow attackers to scan internal infrastructure by supplying arbitrary URLs.
**Learning:** Preventing SSRF using standard `fetch` is tricky with redirects. If `redirect: 'manual'` is set and all redirects are rejected, legitimate scraping is broken.
**Prevention:** Intercept the redirect manually, extract the `Location` header, and fully re-validate the new URL using a helper like `isSafeUrl` before explicitly fetching the next hop.
