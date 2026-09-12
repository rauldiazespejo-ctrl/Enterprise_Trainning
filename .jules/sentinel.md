## 2024-09-12 - [Missing Authentication in AI Course Generation Edge Function]
**Vulnerability:** The `generate-course` Supabase Edge Function lacked explicit authentication validation, allowing any unauthenticated client to invoke the DeepSeek API using the server's API key.
**Learning:** Supabase Edge Functions do not enforce authentication by default. They rely on manual verification using the `Authorization` header and the Supabase JS client (`auth.getUser()`).
**Prevention:** Always implement explicit authentication validation in Edge Functions using `auth.getUser()`, throwing a custom `AuthError` to deny access and returning a 401 status code (Fail Closed principle).
