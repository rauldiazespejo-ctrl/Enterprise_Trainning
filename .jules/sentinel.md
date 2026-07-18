## 2025-02-13 - Add missing authentication to generate-course Edge Function
**Vulnerability:** The `generate-course` Supabase Edge Function lacked an explicit authentication check before proceeding with its logic, meaning anyone with the function URL could invoke it and consume backend resources/API quotas.
**Learning:** Supabase Edge Functions do not automatically enforce authentication. Always explicitly extract the `Authorization` header and validate the request using `supabase.auth.getUser()` to ensure only authorized users can access sensitive or paid endpoints.
**Prevention:** Include a boilerplate authentication validation block at the beginning of sensitive Edge Functions (after the OPTIONS check for CORS) before running the core logic.
