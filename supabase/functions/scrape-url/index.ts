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

    // SSRF Mitigation Helpers
    const isPrivateIP = (ip: string): boolean => {
      if (ip.includes('.')) {
        const parts = ip.split('.').map(Number);
        if (parts.length !== 4 || parts.some(isNaN)) return false;
        if (parts[0] === 10 || parts[0] === 127 || parts[0] === 0) return true;
        if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
        if (parts[0] === 192 && parts[1] === 168) return true;
        if (parts[0] === 169 && parts[1] === 254) return true;
        return false;
      }
      if (ip.includes(':')) {
        const lowerIp = ip.toLowerCase();
        if (lowerIp === '::1' || lowerIp === '::') return true;
        if (lowerIp.startsWith('fc') || lowerIp.startsWith('fd')) return true;
        if (lowerIp.startsWith('fe8') || lowerIp.startsWith('fe9') || lowerIp.startsWith('fea') || lowerIp.startsWith('feb')) return true;
        if (lowerIp.startsWith('::ffff:')) return true;
        return false;
      }
      return false;
    };

    const validateHost = async (targetUrl: URL): Promise<boolean> => {
      if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') return false;
      const hostname = targetUrl.hostname.replace(/^\[(.*)\]$/, '$1');
      if (isPrivateIP(hostname)) return false;
      if (hostname === 'localhost') return false;

      // Note: TOCTOU limitation exists here, but adds defense in depth
      try {
        const ipsA = await Deno.resolveDns(hostname, 'A');
        if (ipsA.some(isPrivateIP)) return false;
      } catch (e: any) {
        if (e.name !== 'NotFound' && e.name !== 'NotSupported' && !(e instanceof TypeError)) return false;
      }

      try {
        const ipsAAAA = await Deno.resolveDns(hostname, 'AAAA');
        if (ipsAAAA.some(isPrivateIP)) return false;
      } catch (e: any) {
        if (e.name !== 'NotFound' && e.name !== 'NotSupported' && !(e instanceof TypeError)) return false;
      }
      return true;
    };

    // Configurar headers para parecer un navegador
    const fetchHeaders = new Headers({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
    });

    let currentUrl = url;
    let response: Response | null = null;
    let redirects = 0;
    const MAX_REDIRECTS = 5;

    while (redirects < MAX_REDIRECTS) {
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(currentUrl);
      } catch (e) {
        throw new Error("URL inválida");
      }

      const isValid = await validateHost(parsedUrl);
      if (!isValid) {
        throw new Error("URL no permitida por razones de seguridad");
      }

      response = await fetch(currentUrl, {
        headers: fetchHeaders,
        redirect: 'manual'
      });

      if (response.status >= 300 && response.status < 400 && response.headers.has('location')) {
        await response.body?.cancel(); // Prevent resource leaks
        const location = response.headers.get('location')!;
        currentUrl = new URL(location, currentUrl).toString();
        redirects++;
      } else {
        break;
      }
    }

    if (!response || !response.ok) {
      await response?.body?.cancel();
      throw new Error(`Error al acceder a la URL: ${response?.statusText || 'Max redirects exceeded'}`);
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
