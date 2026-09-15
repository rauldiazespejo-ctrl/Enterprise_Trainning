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

    console.log(`Buscando contenido de: ${url}`);
    
    // Configurar headers para parecer un navegador
    const fetchHeaders = new Headers({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
    });

    const isInternalIp = (ip: string): boolean => {
      if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
        return /^127\./.test(ip) || /^10\./.test(ip) || /^192\.168\./.test(ip) || /^169\.254\./.test(ip) || /^0\./.test(ip) || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip);
      }
      if (ip.includes(':')) {
        const cleanIp = ip.replace(/^\[|\]$/g, '').toLowerCase();
        return cleanIp === '::1' || cleanIp === '::' || cleanIp.startsWith('fc') || cleanIp.startsWith('fd') || cleanIp.startsWith('fe8') || cleanIp.startsWith('::ffff:');
      }
      return ip.toLowerCase() === 'localhost';
    };

    let currentUrl = url;
    let response: Response | null = null;

    // Follow redirects manually to mitigate SSRF bypasses via redirects
    for (let i = 0; i < 5; i++) {
      const parsedUrl = new URL(currentUrl);

      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error("Protocolo no permitido (solo http/https).");
      }

      if (isInternalIp(parsedUrl.hostname)) {
        throw new Error("URL apunta a una dirección IP o host interno no permitido.");
      }

      // DNS Rebinding check (Note: inherent TOCTOU limitation when not using specialized clients)
      let resolvedIps: string[] = [];
      const isHostnameIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(parsedUrl.hostname) || parsedUrl.hostname.includes(':');

      if (!isHostnameIp) {
        try { resolvedIps = [...resolvedIps, ...(await Deno.resolveDns(parsedUrl.hostname, 'A'))]; }
        catch (e) { if (!(e instanceof Deno.errors.NotFound || e instanceof Deno.errors.NotSupported || e instanceof TypeError)) throw e; }

        try { resolvedIps = [...resolvedIps, ...(await Deno.resolveDns(parsedUrl.hostname, 'AAAA'))]; }
        catch (e) { if (!(e instanceof Deno.errors.NotFound || e instanceof Deno.errors.NotSupported || e instanceof TypeError)) throw e; }

        if (resolvedIps.some(isInternalIp)) {
           throw new Error("El dominio se resuelve a una dirección IP interna no permitida.");
        }
      }

      response = await fetch(currentUrl, { headers: fetchHeaders, redirect: 'manual' });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        response.body?.cancel(); // Prevent resource leaks
        if (!location) throw new Error("Redirección sin cabecera Location.");
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      break;
    }
    
    if (!response || !response.ok) {
      throw new Error(`Error al acceder a la URL: ${response?.statusText || 'Max redirects reached'}`);
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
