## 2024-07-19 - SSRF and Missing Auth in scrape-url
**Vulnerability:** Missing authentication and lack of URL restriction in the `scrape-url` Supabase Edge Function exposed it to Server-Side Request Forgery (SSRF) and resource abuse risks.
**Learning:** Edge functions are not automatically protected by authentication or Row Level Security (RLS) like database operations. They must explicitly validate the `Authorization` header using `auth.getUser()`.
**Prevention:** Always require authentication on sensitive Edge Functions by explicitly validating the caller's session via `auth.getUser()`, and validate/restrict input parameters like URLs when making outbound requests.
