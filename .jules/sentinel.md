## 2024-08-04 - SSRF in scrape-url Edge Function
**Vulnerability:** The `scrape-url` Supabase Edge Function fetches external content based on a user-provided URL without verifying the destination, allowing for Server-Side Request Forgery (SSRF) against internal networks or cloud metadata APIs.
**Learning:** External fetch operations that take user-provided URLs must explicitly block local, internal, and private IP ranges and restrict protocols to prevent internal network scanning and unauthorized access.
**Prevention:** Always validate and sanitize user-provided URLs using `new URL()` to handle normalization, explicitly verify that the protocol is HTTP/HTTPS, and reject hostnames/IPs corresponding to private ranges or loopback addresses before calling `fetch()`.
