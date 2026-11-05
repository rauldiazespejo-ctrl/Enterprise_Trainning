## 2024-05-31 - [SSRF Protection]
**Vulnerability:** The edge function `scrape-url` accepts arbitrary URLs and fetches them. Without explicitly filtering internal and private IP ranges, this allows Server-Side Request Forgery (SSRF), exposing internal services or cloud metadata endpoints.
**Learning:** `fetch` must be wrapped to explicitly deny private IP ranges. Just parsing URLs and checking if they resolve to a private IP via DNS (for both A and AAAAA records) is necessary because an attacker could use custom DNS or direct IPs.
**Prevention:** Implement SSRF mitigation via DNS resolution and strict IP filtering on all outbound arbitrary fetches in edge functions. Cancel fetches to private IP addresses.
