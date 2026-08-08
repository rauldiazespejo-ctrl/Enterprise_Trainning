## 2025-02-14 - Fix SSRF Vulnerability in Edge Function
**Vulnerability:** Server-Side Request Forgery (SSRF) in `supabase/functions/scrape-url/index.ts` where arbitrary URLs from user input were fetched directly without validation.
**Learning:** Supabase Edge Functions execute in a cloud environment where accessing private network IPs or cloud metadata endpoints (like `169.254.169.254`) could expose sensitive internal configuration, credentials, or bypass firewalls.
**Prevention:** Always implement SSRF protection when fetching external URLs in Edge Functions. Parse the URL using `new URL()`, verify the protocol is HTTP/HTTPS, and explicitly block requests to local, private, internal, and cloud metadata IP addresses or hostnames.
