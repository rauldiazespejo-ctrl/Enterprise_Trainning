## 2024-05-18 - SSRF Vulnerability in fetch
**Vulnerability:** Found `fetch(url)` in `supabase/functions/scrape-url/index.ts` with no SSRF protection (allows calls to internal IPs like `169.254.169.254`, `localhost`, etc).
**Learning:** Functions doing external scraping must protect against Server-Side Request Forgery by validating the target IP. Supabase edge functions don't restrict outbound network access by default. Deno's `fetch` will happily connect to local interfaces.
**Prevention:** Always validate URLs using `new URL()` and explicitly deny access to localhost, link-local, private IPv4/IPv6 ranges, and cloud metadata IPs before fetching.

## 2024-05-18 - IDOR and Unauthenticated Access in audit-log
**Vulnerability:** `audit-log` function uses `SUPABASE_SERVICE_ROLE_KEY` to insert records but doesn't verify the caller. Anyone can send POST requests with any `user_id` to log arbitrary audit events.
**Learning:** Using the service role key bypasses Row Level Security. You must manually extract the `Authorization` header and verify the user session using `supabase.auth.getUser()` to ensure they are authenticated and prevent IDOR (impersonating `user_id`).
**Prevention:** If an edge function uses `serviceRoleKey`, explicitly require and validate the caller's JWT via `Authorization` header.
