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

const isInternalIP = (host: string): boolean => {
  if (host.includes(':')) {
    const v6 = host.replace(/^\[|\]$/g, '').toLowerCase();
    return v6 === '::1' || v6 === '::' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80') || v6.startsWith('::ffff:');
  }
  return /^127\.\d+\.\d+\.\d+$/.test(host) || /^10\.\d+\.\d+\.\d+$/.test(host) ||
         /^192\.168\.\d+\.\d+$/.test(host) || /^169\.254\.\d+\.\d+$/.test(host) ||
         /^0\.\d+\.\d+\.\d+$/.test(host) || /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/.test(host) ||
         host.toLowerCase() === 'localhost';
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

    const validateAndResolve = async (urlString: string): Promise<URL> => {
      const parsedUrl = new URL(urlString);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new Error("Protocolo no permitido");
      }

      // Bloquear hostnames que son directamente IPs internas o localhost
      if (isInternalIP(parsedUrl.hostname)) {
        throw new Error("Acceso a IP interna denegado");
      }

      // DNS Resolution (Note: This still has a TOCTOU limitation with standard fetch)
      const aRecords = await Deno.resolveDns(parsedUrl.hostname, 'A').catch(() => []);
      for (const ip of aRecords) {
        if (isInternalIP(ip)) throw new Error("Acceso a IP interna denegado (A)");
      }

      const aaaaRecords = await Deno.resolveDns(parsedUrl.hostname, 'AAAA').catch(() => []);
      for (const ip of aaaaRecords) {
        if (isInternalIP(ip)) throw new Error("Acceso a IP interna denegado (AAAA)");
      }

      return parsedUrl;
    };

    let currentUrl = url;
    let redirectCount = 0;
    const MAX_REDIRECTS = 5;
    let finalResponse: Response | null = null;

    while (redirectCount <= MAX_REDIRECTS) {
      const urlObj = await validateAndResolve(currentUrl);

      const response = await fetch(urlObj.toString(), {
        headers: fetchHeaders,
        redirect: 'manual'
      });

      const status = response.status;
      if (status >= 300 && status < 400 && response.headers.has('location')) {
        await response.body?.cancel(); // Important to avoid resource leaks
        const location = response.headers.get('location')!;
        currentUrl = new URL(location, currentUrl).toString();
        redirectCount++;
      } else {
        finalResponse = response;
        break;
      }
    }

    if (!finalResponse) {
      throw new Error("Demasiados redireccionamientos");
    }

    if (!finalResponse.ok) {
      throw new Error(`Error al acceder a la URL: ${finalResponse.statusText}`);
    }

    const html = await finalResponse.text();

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
