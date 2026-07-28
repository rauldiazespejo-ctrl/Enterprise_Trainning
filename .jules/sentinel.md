## 2024-07-28 - Missing Authentication in Supabase Edge Functions
**Vulnerability:** Supabase Edge Functions (e.g., `generate-course`) lacked explicit request authentication, allowing unauthorized arbitrary access.
**Learning:** Supabase Edge Functions do not enforce Auth or RLS by default. Requests can be invoked without a valid user session unless strictly checked manually using `supabase.auth.getUser()`.
**Prevention:** Always implement manual token extraction (`Authorization` header) and instantiate a scoped `createClient` using `global.headers` to explicitly check user validity (`getUser()`). Crucially, follow the 'Fail Closed' principle: throw an `AuthError` to deny access when credentials or valid sessions are missing, rather than logging or proceeding.
