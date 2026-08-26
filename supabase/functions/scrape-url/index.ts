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

    const checkIp = (ip: string): boolean => {
      if (!ip) return false;

      // Handle IPv4-mapped IPv6 addresses (e.g. ::ffff:127.0.0.1)
      if (ip.toLowerCase().startsWith('::ffff:')) {
        ip = ip.substring(7);
      }

      if (ip === '::1' || ip === '::') return true;
      if (ip.includes(':')) {
         return ip.startsWith('fd') || ip.startsWith('fe80') || ip.startsWith('fc00');
      }
      const parts = ip.split('.').map(Number);
      if (parts.length !== 4 || parts.some(isNaN)) return false;
      const [a, b] = parts;
      if (a === 127 || a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254) || a === 0) return true;
      return false;
    };

    const validateUrl = async (urlString: string): Promise<string> => {
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(urlString);
      } catch (e) {
        throw new Error("URL inválida: " + (e instanceof Error ? e.message : ''));
      }

      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new Error('Protocolo no permitido');
      }

      const hostname = parsedUrl.hostname.toLowerCase();
      if (['localhost', '[::1]', '[::]'].includes(hostname) || hostname.endsWith('.local')) {
        throw new Error('Destino no permitido');
      }

      let ips: string[] = [];
      try {
        const aRecords = await Deno.resolveDns(hostname, 'A').catch(() => []);
        const aaaaRecords = await Deno.resolveDns(hostname, 'AAAA').catch(() => []);
        ips = [...aRecords, ...aaaaRecords];
      } catch (e) {
        // Fallback
      }

      if (ips.length > 0) {
        if (ips.some(checkIp)) {
          throw new Error('IP resuelta no permitida');
        }
      } else if (checkIp(hostname.replace(/\[|\]/g, ''))) {
        throw new Error('IP no permitida');
      }

      return parsedUrl.toString();
    };

    // Configurar headers para parecer un navegador
    const fetchHeaders = new Headers({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
    });

    let currentUrl = await validateUrl(url);
    const originalHostname = new URL(currentUrl).hostname;

    // We do NOT modify the hostname to IP to prevent breaking SNI on fetch.
    // Instead we rely on the Deno.resolveDns check above. Since this is an edge
    // function running in an isolated environment, basic DNS check before fetch
    // reduces SSRF risk substantially. A robust solution against DNS rebinding
    // requires a custom fetch client that locks the socket to the verified IP,
    // which is not supported natively by Deno fetch without an explicit agent
    // overriding SNI, which Deno's fetch doesn't support easily.
    // Thus we proceed with the hostname.

    let response: Response | null = null;

    // Follow up to 5 redirects manually to prevent SSRF via redirect
    let maxRedirects = 5;
    
    while (maxRedirects > 0) {
      console.log(`Buscando contenido de: ${currentUrl}`);
      response = await fetch(currentUrl, {
        headers: fetchHeaders,
        redirect: 'manual'
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) {
          throw new Error('Redirección sin cabecera Location');
        }

        // Handle relative URLs correctly using URL constructor
        let nextUrlStr;
        try {
          nextUrlStr = new URL(location, currentUrl).href;
        } catch {
          throw new Error('URL de redirección inválida');
        }

        currentUrl = await validateUrl(nextUrlStr);
        maxRedirects--;
      } else {
        break;
      }
    }

    if (maxRedirects === 0 && response && [301, 302, 303, 307, 308].includes(response.status)) {
       throw new Error('Demasiadas redirecciones');
    }

    if (!response || !response.ok) {
      throw new Error(`Error al acceder a la URL: ${response?.statusText || 'Desconocido'}`);
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
  } catch (error: any) {
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
