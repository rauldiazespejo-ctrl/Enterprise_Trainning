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

    // ── SSRF Protection ───────────────────────────────────────────────────────
    const isSafeIp = (ip: string): boolean => {
      if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(ip)) return false;
      if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return false;
      if (ip.includes(':')) {
        const v6 = ip.toLowerCase();
        if (v6 === '::1' || v6 === '::' || /^f[cd]/.test(v6) || /^fe80/.test(v6) || /^::ffff:/.test(v6)) return false;
      }
      return true;
    };

    const resolveSafe = async (hostname: string, recordType: 'A' | 'AAAA'): Promise<string[]> => {
      try {
        return await Deno.resolveDns(hostname, recordType);
      } catch (err: any) {
        if (err.name === 'NotFound' || err.name === 'NotSupported') return [];
        throw err; // Fail closed on other DNS errors
      }
    };

    const safeFetch = async (targetUrl: string, init: RequestInit, maxRedirects = 3): Promise<Response> => {
      let currentUrl = targetUrl;
      let redirects = 0;

      while (redirects <= maxRedirects) {
        const parsed = new URL(currentUrl);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          throw new Error('Solo se permiten URLs HTTP/HTTPS.');
        }

        const hostname = parsed.hostname.replace(/[[\]]/g, '');
        if (hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
          throw new Error('Acceso denegado a host local.');
        }

        if (/^[\d.]+$/.test(hostname) || hostname.includes(':')) {
          if (!isSafeIp(hostname)) throw new Error('IP no permitida.');
        } else {
          // Pre-fetch DNS resolution to check for private IPs (Note: Inherits TOCTOU limitation)
          const [ips4, ips6] = await Promise.all([
            resolveSafe(hostname, 'A'),
            resolveSafe(hostname, 'AAAA')
          ]);
          const allIps = [...ips4, ...ips6];
          if (allIps.length === 0) throw new Error('No se pudo resolver el host.');
          if (!allIps.every(isSafeIp)) throw new Error('El host resuelve a una IP no permitida (SSRF).');
        }

        const response = await fetch(currentUrl, { ...init, redirect: 'manual' });

        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location');
          if (!location) return response; // Let caller handle weird redirect
          response.body?.cancel(); // Prevent resource leaks
          currentUrl = new URL(location, currentUrl).href;
          redirects++;
        } else {
          return response;
        }
      }
      throw new Error('Demasiadas redirecciones.');
    };

    const response = await safeFetch(url, { headers: fetchHeaders });
    
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
