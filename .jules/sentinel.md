## 2025-02-14 - SSRF in scrape-url Edge Function
**Vulnerability:** The Supabase Edge Function `scrape-url` accepted any URL without validation, allowing a Server-Side Request Forgery (SSRF). Attackers could exploit this to query internal IP addresses (e.g., 127.0.0.1) or cloud metadata endpoints (169.254.169.254).
**Learning:** External URL fetching without SSRF protection in serverless functions is a critical risk, especially for a utility that explicitly acts as a proxy for scraping data based on user input.
**Prevention:** Always validate and normalize URLs using `new URL()` and explicitly block local, private, and internal network IP ranges and hostnames before making `fetch` calls.
