## 2025-02-23 - Missing Authentication in Edge Functions
**Vulnerability:** Supabase Edge Function `generate-course` lacked explicit authentication validation, allowing unauthenticated abuse of the DeepSeek API endpoint.
**Learning:** In this project, Supabase Edge Functions do not automatically enforce authentication.
**Prevention:** Always explicitly validate requests by extracting the `Authorization` header, initializing a Supabase client, and calling `auth.getUser()`. Follow the 'Fail Closed' principle by throwing a custom `AuthError` (returning HTTP 401) if auth configuration or headers are missing.
