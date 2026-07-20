## 2024-10-24 - [Unauthenticated Edge Functions]
**Vulnerability:** Supabase Edge Functions (`generate-course` and `audit-log`) did not have explicit authentication validation in place, allowing unauthorized invocations if the URL was discovered. This exposed the system to possible API credit exhaustion (LLM calls) and unverified audit log writes.
**Learning:** Supabase Edge Functions do not enforce RLS or session validation automatically just because they are hosted on Supabase. They are public endpoints by default unless explicitly secured.
**Prevention:** Always extract the `Authorization` header and initialize a Supabase client (`createClient(url, anonKey, { global: { headers: { Authorization } } })`) to explicitly validate sessions with `auth.getUser()` in sensitive Edge Functions.
