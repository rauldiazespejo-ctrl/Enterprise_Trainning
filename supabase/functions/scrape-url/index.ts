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

const isSafeUrl = (urlString: string): boolean => {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const hostname = url.hostname;

    // Bloquear localhost, dominios .local, IPv6 loopback/unspecified
    if (hostname === 'localhost' || hostname.endsWith('.local') || hostname === '[::1]' || hostname === '[::]') return false;

    // Bloquear direcciones IPv4 privadas, locales y metadata cloud
    if (/^127\.\d+\.\d+\.\d+$/.test(hostname)) return false; // 127.0.0.0/8
    if (/^10\.\d+\.\d+\.\d+$/.test(hostname)) return false; // 10.0.0.0/8
    if (/^192\.168\.\d+\.\d+$/.test(hostname)) return false; // 192.168.0.0/16
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/.test(hostname)) return false; // 172.16.0.0/12
    if (/^169\.254\.169\.254$/.test(hostname)) return false; // Cloud metadata
    if (/^0\.\d+\.\d+\.\d+$/.test(hostname)) return false; // 0.0.0.0/8

    return true;
  } catch {
    return false;
  }
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

    let currentUrl = url;
    let redirects = 0;
    const maxRedirects = 5;
    let response: Response | null = null;

    while (redirects < maxRedirects) {
      if (!isSafeUrl(currentUrl)) {
        throw new Error("URL no permitida o insegura (SSRF detectado)");
      }

      response = await fetch(currentUrl, {
        headers: fetchHeaders,
        redirect: 'manual'
      });

      if (response.status >= 300 && response.status < 400 && response.headers.has('location')) {
        const location = response.headers.get('location');
        if (!location) break;
        currentUrl = new URL(location, currentUrl).toString();
        redirects++;
        continue;
      }
      break;
    }

    if (!response) {
      throw new Error("No se pudo obtener una respuesta válida");
    }

    if (redirects >= maxRedirects) {
      throw new Error("Demasiadas redirecciones");
    }
    
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
