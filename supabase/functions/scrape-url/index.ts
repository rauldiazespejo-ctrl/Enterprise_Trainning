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

// --- SSRF Protection Helpers ---
const isIPv4 = (ip) => /^\d{1,3}(\.\d{1,3}){3}$/.test(ip);
const isIPv6 = (ip) => ip.includes(':');

const isPrivateIP = (ip) => {
  if (isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts.some((p) => p < 0 || p > 255)) return false;
    return (
      parts[0] === 127 ||
      parts[0] === 10 ||
      parts[0] === 0 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      (parts[0] === 169 && parts[1] === 254) ||
      (parts[0] === 169 && parts[1] === 254 && parts[2] === 169 && parts[3] === 254) // Metadata IP
    );
  }
  if (isIPv6(ip)) {
    const norm = ip.toLowerCase();
    return (
      norm === '::1' ||
      norm === '::' ||
      norm.startsWith('fc') ||
      norm.startsWith('fd') ||
      norm.startsWith('fe8') ||
      norm.startsWith('fe9') ||
      norm.startsWith('fea') ||
      norm.startsWith('feb') ||
      norm.startsWith('::ffff:')
    );
  }
  return false;
};

const validateUrlHost = async (urlString) => {
  let parsedUrl;
  try {
    parsedUrl = new URL(urlString);
  } catch (e) {
    throw new Error('URL inválida');
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('Protocolo no permitido');
  }

  let hostname = parsedUrl.hostname;
  // Handle IPv6 brackets in URL parsing
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    hostname = hostname.slice(1, -1);
  }

  if (isPrivateIP(hostname)) {
    throw new Error('No se permite el acceso a IPs privadas o internas');
  }

  if (hostname === 'localhost' || hostname.includes('internal')) {
     throw new Error('No se permite el acceso a hosts internos');
  }

  // Pre-fetch DNS resolution for Rebinding protection (TOCTOU mitigation attempt)
  if (!isIPv4(hostname) && !isIPv6(hostname)) {
    try {
      const records4 = await Deno.resolveDns(hostname, 'A');
      for (const ip of records4) {
        if (isPrivateIP(ip)) throw new Error('El dominio resuelve a una IP privada');
      }
    } catch (e) {
      if (!(e instanceof Deno.errors.NotFound) && !(e instanceof Deno.errors.NotSupported)) {
        throw e;
      }
    }

    try {
      const records6 = await Deno.resolveDns(hostname, 'AAAA');
      for (const ip of records6) {
        if (isPrivateIP(ip)) throw new Error('El dominio resuelve a una IP privada');
      }
    } catch (e) {
      if (!(e instanceof Deno.errors.NotFound) && !(e instanceof Deno.errors.NotSupported)) {
        throw e;
      }
    }
  }

  return parsedUrl;
};
// -------------------------------

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

    const parsedUrl = await validateUrlHost(url);

    let currentUrl = parsedUrl.href;
    let response;
    let redirectCount = 0;
    const MAX_REDIRECTS = 5;

    while (redirectCount < MAX_REDIRECTS) {
      response = await fetch(currentUrl, {
        headers: fetchHeaders,
        redirect: 'manual'
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) break;

        response.body?.cancel();

        const nextUrl = new URL(location, currentUrl).href;
        await validateUrlHost(nextUrl);
        currentUrl = nextUrl;
        redirectCount++;
      } else {
        break;
      }
    }

    if (redirectCount >= MAX_REDIRECTS) {
      throw new Error('Demasiados redireccionamientos');
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
