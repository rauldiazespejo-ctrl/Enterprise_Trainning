## 2024-05-18 - SSRF DNS Rebinding in Edge Functions
**Vulnerability:** A standard `fetch(url)` in Supabase Edge Functions allows Server-Side Request Forgery (SSRF) and DNS rebinding bypasses, exposing internal Deno services and cloud metadata.
**Learning:** `new URL()` correctly normalizes octal/hex IPs, but resolving DNS via `Deno.resolveDns` followed by `fetch(hostname)` still leaves a Time-Of-Check to Time-Of-Use (TOCTOU) DNS rebinding window because standard `fetch` doesn't support pinning IPs with custom Server Name Indication (SNI).
**Prevention:** Manual proxying/redirect handling and pre-fetch DNS validation are critical stopgaps, though true prevention requires specialized HTTP clients.
