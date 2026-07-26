## 2024-05-18 - Missing Authentication in Edge Functions
**Vulnerability:** Supabase Edge Functions (like `scrape-url` and `audit-log`) were missing explicit authentication validation.
**Learning:** Supabase Edge Functions do not enforce authentication by default; if not explicitly implemented, endpoints are publicly accessible, which can lead to severe security risks such as Server-Side Request Forgery (SSRF) when functions interact with external URLs.
**Prevention:** Always implement explicit authentication validation by extracting the `Authorization` header, initializing a Supabase client with the provided token, and calling `auth.getUser()`. Follow the "Fail Closed" principle: deny access if configuration or tokens are missing.
