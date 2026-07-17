## 2025-02-28 - Missing Authentication in AI Edge Function
**Vulnerability:** The `generate-course` Supabase Edge Function proxied calls to the paid DeepSeek API without validating the request's authorization token, allowing any external user to trigger AI generations and cause a Financial DoS.
**Learning:** Even if the frontend UI hides functionality behind a login screen, Edge Functions exposed to the public internet are inherently insecure if they do not explicitly require and validate authentication tokens (e.g., using `supabase.auth.getUser()`).
**Prevention:** Always extract the `Authorization` header in Edge Functions, use it to initialize a Supabase client, and mandate session validation using `auth.getUser()` before executing core logic or accessing third-party paid APIs.
