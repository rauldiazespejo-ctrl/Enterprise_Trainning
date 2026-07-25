## 2025-03-03 - [CRITICAL] Missing Auth in Edge Functions
**Vulnerability:** Supabase Edge Function (`generate-course/index.ts`) lacked authentication, allowing unauthorized users to invoke the function and use the DeepSeek API key, resulting in a potential Denial of Service and API quota depletion.
**Learning:** Edge Functions do not automatically enforce authentication. They act as public endpoints unless explicit checks (like `auth.getUser()` with an `Authorization` header) are added.
**Prevention:** Always explicitly validate the `Authorization` header for protected endpoints, utilize a dedicated `AuthError` class for clean 401 handling, and fail securely if auth configuration variables are missing.
