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

    const isLocalOrPrivateIp = (ip: string) => {
      if (ip === 'localhost') return true;
      if (/^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|169\.254\.|0\.)[0-9.]+$/.test(ip)) return true;
      if (ip === '::1' || /^(fc|fd|fe8)[0-9a-f:]*$/i.test(ip)) return true;
      return false;
    };

    let currentUrl = url;
    let redirectsCount = 0;
    const MAX_REDIRECTS = 5;
    let response: Response | null = null;

    while (redirectsCount <= MAX_REDIRECTS) {
      const parsedUrl = new URL(currentUrl);
      const hostname = parsedUrl.hostname.replace(/^\[|\]$/g, '');

      // Resolve DNS to prevent DNS rebinding attacks and SSRF
      let ips: string[] = [];
      const isIP = /^[0-9.]+$/.test(hostname) || hostname.includes(':');

      if (isIP) {
        ips = [hostname];
      } else {
        try {
          const recordsA = await Deno.resolveDns(hostname, "A").catch(() => []);
          const recordsAAAA = await Deno.resolveDns(hostname, "AAAA").catch(() => []);
          ips = [...recordsA, ...recordsAAAA];
        } catch (e) {
          throw new Error("DNS resolution failed");
        }

        if (ips.length === 0) {
           throw new Error("DNS resolution returned no records");
        }
      }

      for (const ip of ips) {
        if (isLocalOrPrivateIp(ip)) {
          throw new Error("SSRF Detected: Acceso a red interna o privada denegado.");
        }
      }

      response = await fetch(currentUrl, {
        headers: fetchHeaders,
        redirect: 'manual' // manual redirection handling
      });

      if (response.status >= 300 && response.status < 400 && response.headers.has('location')) {
        const location = response.headers.get('location');
        response.body?.cancel(); // Important: prevent resource leaks
        if (!location) break;
        currentUrl = new URL(location, currentUrl).toString();
        redirectsCount++;
      } else {
        break;
      }
    }

    if (!response || !response.ok) {
      throw new Error(`Error al acceder a la URL: ${response ? response.statusText : 'Demasiados redireccionamientos'}`);
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
