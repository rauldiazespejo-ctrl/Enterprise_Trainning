import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Allowed origins for CORS validation
const DEFAULT_ALLOWED_ORIGINS = 'http://localhost:5173,http://localhost:3000,https://capacita-pro.vercel.app';

const getAllowedOrigins = (): string[] => {
  const envOrigins = Deno.env.get('ALLOWED_ORIGINS');
  return envOrigins ? envOrigins.split(',').map(o => o.trim()) : DEFAULT_ALLOWED_ORIGINS.split(',');
};

const isOriginAllowed = (origin: string | null): boolean => {
  if (!origin) return false;
  const allowed = getAllowedOrigins();
  return allowed.includes(origin);
};

const buildCorsHeaders = (origin: string | null): Record<string, string> => {
  const allowedOrigin = isOriginAllowed(origin) ? origin : '';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = buildCorsHeaders(origin);

  // Reject if origin is not allowed
  if (origin && !isOriginAllowed(origin)) {
    console.log(`CORS rejected for origin: ${origin}`);
    return new Response(
      JSON.stringify({ success: false, error: 'Origin not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      }
    );
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      throw new Error("Se requiere una URL válida");
    }

    // SSRF Protection using Deno.resolveDns
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new Error("Solo se permiten URLs HTTP/HTTPS");
      }

      const hostname = parsedUrl.hostname;
      if (
        hostname === 'localhost' ||
        hostname.endsWith('.local') ||
        hostname.endsWith('.nip.io') ||
        hostname.endsWith('.sslip.io')
      ) {
        throw new Error("URL no permitida");
      }

      let ipv4Addresses: string[] = [];
      let ipv6Addresses: string[] = [];

      try {
        // En Deno, Deno.resolveDns es la forma nativa de resolver.
        // Si el hostname ya es una IP (ej: 127.0.0.1, 2130706433, 0x7f.0.0.1), Deno fetch fallará si es inválida,
        // pero necesitamos bloquear las IPs directamente en caso de bypasses.

        // Es un IP directo?
        const isIp = /^([0-9a-fA-F:.]+)$/.test(hostname) || /^[0-9]+$/.test(hostname);

        try {
          ipv4Addresses = await Deno.resolveDns(hostname, "A");
        } catch {
          // ignore
        }
        try {
          ipv6Addresses = await Deno.resolveDns(hostname, "AAAA");
        } catch {
          // ignore
        }

        // Si es una IP que no se resuelve por DNS, parsearla manualmente
        if (ipv4Addresses.length === 0 && ipv6Addresses.length === 0 && isIp) {
             // For string IPs that don't resolve, fallback to string inspection or block to be safe.
             // If we can't resolve it, and it looks like an IP, it might be a bypass.
             // To be secure, we can try fetching it locally and catching network errors, but we can't reliably block all.
             // Deno URL parsing already normalizes many IPs to hostname.
             ipv4Addresses = [hostname]; // Try treating it as IPv4 string
        }

      } catch (e) {
        throw new Error("Error resolviendo dominio");
      }

      const allIps = [...ipv4Addresses, ...ipv6Addresses];

      if (allIps.length === 0) {
        throw new Error("No se pudo resolver el dominio");
      }

      for (const ip of allIps) {
        // IPv4 check
        if (ip.includes('.')) {
          const parts = ip.split('.');
          if (parts.length === 4) {
            const a = parseInt(parts[0], 10);
            const b = parseInt(parts[1], 10);

            if (
              a === 127 || // Loopback
              a === 10 || // Private
              (a === 172 && b >= 16 && b <= 31) || // Private
              (a === 192 && b === 168) || // Private
              (a === 169 && b === 254) || // Link-local
              a === 0 || // 0.0.0.0
              a === 255 // Broadcast
            ) {
              throw new Error("Resolución a IP no permitida");
            }
          }
        }
        // IPv6 check
        if (ip.includes(':')) {
          const lowerIp = ip.toLowerCase();
          if (
            lowerIp === '::1' || // Loopback
            lowerIp === '::' || // Unspecified
            lowerIp.startsWith('fe80:') || // Link-local
            lowerIp.startsWith('fc00:') || // Unique local
            lowerIp.startsWith('fd00:') || // Unique local
            lowerIp.startsWith('::ffff:127.') // IPv4-mapped loopback
          ) {
            throw new Error("Resolución a IP no permitida");
          }
        }
      }

    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "URL no válida");
    }

    console.log(`Buscando contenido de: ${url}`);
    
    // Configurar headers para parecer un navegador
    const fetchHeaders = new Headers({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
    });

    const response = await fetch(url, { headers: fetchHeaders });
    
    if (!response.ok) {
      throw new Error(`Error al acceder a la URL: ${response.statusText}`);
    }

    const html = await response.text();

    // 1. Eliminar scripts y styles
    let cleanText = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
    cleanText = cleanText.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
    
    // 2. Eliminar tags HTML y reemplazarlos por espacios
    cleanText = cleanText.replace(/<[^>]+>/g, ' ');

    // 3. Decodificar entidades HTML básicas
    cleanText = cleanText
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // 4. Limpiar espacios múltiples y saltos de línea excesivos
    cleanText = cleanText.replace(/\s+/g, ' ').trim();

    return new Response(
      JSON.stringify({
        success: true,
        text: cleanText,
        title: url
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("Error en scrape-url:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
