## 2023-11-01 - Local Auth Fallback Security Debt
**Vulnerability:** Insecure plaintext password comparison (`foundUser.password !== password`) in local fallback auth logic (`src/contexts/AuthContext.tsx`).
**Learning:** Local dev/demo fallback bypassed security standards (hashing) for convenience, causing technical debt.
**Prevention:** Even in fallback or local development modes, passwords should be stored and compared as hashes, or mock auth should rely on secure tokens.
## 2023-11-01 - SSRF Vulnerability in Scrape URL
**Vulnerability:** The `scrape-url` Supabase Edge Function directly fetches user-provided URLs (`await fetch(url)`) without validating the hostname or implementing SSRF protections.
**Learning:** This could allow an attacker to send requests to internal network services, private IP ranges (like `127.0.0.1` or AWS metadata endpoints), or conduct port scanning from the Supabase environment.
**Prevention:** Implement strict URL validation for external requests. Parse the URL, ensure the protocol is HTTP/HTTPS, resolve the DNS to check against private/local IP ranges (SSRF protection), and set `{ redirect: 'manual' }` to block malicious redirects.
