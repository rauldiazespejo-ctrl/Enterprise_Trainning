## 2024-05-24 - [Fix Missing Authentication in Edge Functions]
**Vulnerability:** Edge Functions (`generate-course`, `scrape-url`) lacked explicit authentication checks, allowing unauthenticated proxy abuse or excessive API key consumption.
**Learning:** Supabase Edge Functions do not enforce RLS or session validation by default; they execute openly unless `Authorization` is manually checked.
**Prevention:** Always extract the `Authorization` header, initialize `createClient`, and strictly call `supabase.auth.getUser()` to validate requests. Employ a 'Fail Closed' pattern by throwing a custom `AuthError` (to return 401) if credentials or the configuration itself are missing.
