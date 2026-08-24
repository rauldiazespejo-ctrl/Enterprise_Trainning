## 2025-02-28 - SSRF protection requires blocking HTTP redirects
**Vulnerability:** A URL scraper Edge Function implemented SSRF protection for the initial URL, but failed to block HTTP redirects.
**Learning:** `fetch` follows redirects automatically by default. An attacker could bypass initial URL validation by passing a legitimate external URL that responds with a 302 redirect to an internal IP (like `http://169.254.169.254/`).
**Prevention:** Always set `{ redirect: 'manual' }` in `fetch` calls handling user-provided URLs and block or strictly validate any redirect responses.
