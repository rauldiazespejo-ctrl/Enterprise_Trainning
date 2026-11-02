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

const isPrivateIP = (ip: string): boolean => {
  const cleanIp = ip.replace(/^\[|\]$/g, "").toLowerCase();

  if (cleanIp === 'localhost') return true;

  if (cleanIp.startsWith('::ffff:')) {
    const ipv4Part = cleanIp.substring(7);
    return isPrivateIP(ipv4Part);
  }

  return /^(10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+|192\.168\.\d+\.\d+|127\.\d+\.\d+\.\d+|169\.254\.\d+\.\d+|0\.0\.0\.0)$/.test(cleanIp) ||
         /^::1$/.test(cleanIp) ||
         /^([fF][cCdD]|[fF][eE][89aAbB][0-9a-fA-F])/.test(cleanIp);
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
    
    const maxRedirects = 5;
    let currentUrl = url;
    let response: Response | null = null;

    const fetchHeaders = new Headers({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
    });

    for (let i = 0; i <= maxRedirects; i++) {
      const urlObj = new URL(currentUrl);

      let resolvedIps: string[] = [];
      const aRecords = await Deno.resolveDns(urlObj.hostname, "A").catch(() => []);
      const aaaaRecords = await Deno.resolveDns(urlObj.hostname, "AAAA").catch(() => []);
      resolvedIps = [...aRecords, ...aaaaRecords];

      if (resolvedIps.length === 0) {
        resolvedIps = [urlObj.hostname];
      }

      for (const ip of resolvedIps) {
        if (isPrivateIP(ip)) {
          throw new Error(`SSRF blocked: IP ${ip} is private/internal.`);
        }
      }

      console.log(`Buscando contenido de: ${currentUrl}`);

      // Mitigation against DNS Rebinding: We use the first resolved IP instead of hostname
      // We also verify it's not empty and it is an IP (otherwise it fallback to original currentUrl which was tested string)
      let fetchUrlStr = currentUrl;
      const firstValidIp = resolvedIps[0];

      if (firstValidIp && firstValidIp !== urlObj.hostname && !isPrivateIP(firstValidIp)) {
          const fetchUrlObj = new URL(currentUrl);

          // Only safe to substitute IP if protocol is http.
          // In HTTPS, changing the hostname to an IP might result in TLS cert validation failures
          if (fetchUrlObj.protocol === "http:") {
              fetchUrlObj.hostname = firstValidIp.includes(":") ? `[${firstValidIp}]` : firstValidIp;
              fetchUrlStr = fetchUrlObj.toString();
              fetchHeaders.set("Host", urlObj.hostname);
          }
      }

      response = await fetch(fetchUrlStr, {
        headers: fetchHeaders,
        redirect: 'manual'
      });

      if (response.status >= 300 && response.status < 400 && response.headers.has('location')) {
        const location = response.headers.get('location');
        if (response.body) await response.body.cancel();
        if (location) {
          currentUrl = new URL(location, currentUrl).toString();
          continue;
        }
      }

      break;
    }

    if (!response || !response.ok) {
      throw new Error(`Error al acceder a la URL: ${response ? response.statusText : 'Demasiadas redirecciones'}`);
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
