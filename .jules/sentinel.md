## YYYY-MM-DD - Server-Side Request Forgery (SSRF) in Scrape URL
**Vulnerability:** `supabase/functions/scrape-url/index.ts` accepts an arbitrary URL from the client and fetches it without any validation of the domain or IP address, allowing an attacker to request internal network resources, loopback addresses, or cloud metadata services.
**Learning:** This is a classic SSRF vulnerability because user-provided URLs were directly passed to `fetch()`.
**Prevention:** Always validate and parse user-provided URLs before fetching them. Ensure the protocol is http/https and check the hostname against known internal IP ranges and hostnames (localhost, 127.0.0.1, 169.254.169.254, 10.0.0.0/8, etc.). Handle redirects manually to prevent DNS rebinding or redirect-based SSRF.
