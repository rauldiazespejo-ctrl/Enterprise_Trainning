
## 2024-10-24 - Supabase Edge Function SSRF and Missing Authentication
**Vulnerability:** The `scrape-url` Supabase Edge Function acted as an unauthenticated open proxy and lacked SSRF protections, allowing anyone to fetch arbitrary URLs, including internal/private IP ranges and metadata servers.
**Learning:** Supabase Edge Functions do not enforce authentication by default; developers must explicitly validate the `Authorization` header using `supabaseClient.auth.getUser()`. Furthermore, taking a URL as user input without validating its destination exposes the server to SSRF.
**Prevention:** Always implement explicit JWT verification at the start of sensitive Edge Functions. When accepting URLs, parse them using `new URL()` and explicitly block requests to `localhost`, `169.254.x.x`, and private IPv4 blocks before passing them to `fetch()`.
