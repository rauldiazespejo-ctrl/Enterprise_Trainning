## 2025-02-13 - SSRF Vulnerability in Supabase Edge Functions URL Scraper
**Vulnerability:** Server-Side Request Forgery (SSRF) in `supabase/functions/scrape-url/index.ts` where arbitrary URLs from user input were fetched without validation.
**Learning:** Edge functions are executed in environments that can sometimes reach internal resources if not explicitly blocked. The application relied entirely on the user providing a public URL without checking if it pointed to `localhost`, `127.0.0.1`, `169.254.169.254` (metadata servers), or internal network ranges.
**Prevention:** When fetching external URLs provided by users in Edge Functions, always validate the URL protocol (HTTP/HTTPS) and explicitly block local, private, and internal IP address ranges and hostnames.
