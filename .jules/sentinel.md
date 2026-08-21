## 2025-02-21 - IPv6 Hostname Brackets in SSRF Protection
**Vulnerability:** Weak Server-Side Request Forgery (SSRF) validation failing to block `[::1]`.
**Learning:** When using the native Javascript `new URL()` API to parse URLs, the resulting `hostname` property retains the brackets around IPv6 addresses (e.g., `[::1]`), unlike IPv4 addresses. A strict string comparison against `::1` will fail.
**Prevention:** When performing string-based validation against local IPv6 loopback addresses, explicitly include the brackets in the check (`hostname === '[::1]'`).
