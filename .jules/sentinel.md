## 2024-05-15 - [Critical] Missing Authentication in Edge Functions
**Vulnerability:** Supabase Edge Functions (like `generate-course`) exposed expensive API operations (DeepSeek API) without requiring authentication, allowing anonymous callers to consume credits.
**Learning:** Edge Functions in this setup do not automatically enforce authentication. They require explicit validation of the `Authorization` header and fetching the user using `auth.getUser()`.
**Prevention:** Always include a 'Fail Closed' authentication block using `createClient` and `auth.getUser()` in all new or existing Edge Functions that handle sensitive or costly operations.
