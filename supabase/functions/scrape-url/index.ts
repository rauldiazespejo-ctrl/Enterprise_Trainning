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

const isPrivateIP = (ip: string) => {
  if (ip === 'localhost' || ip === '::1') return true;
  const i = ip.replace(/^::ffff:/i, '');
  return /^(10\.\d+|172\.(1[6-9]|2\d|3[0-1])|192\.168|127\.\d+|169\.254|0\.\d+)\.\d+\.\d+$/.test(i) ||
         /^[fF][cCdD]/.test(i) || /^[fF][eE][89aAbB]/.test(i);
};

const safeFetch = async (urlStr: string, options: RequestInit = {}): Promise<Response> => {
  let u;
  try {
    u = new URL(urlStr);
  } catch {
    throw new Error('URL inválida');
  }

  if (!['http:', 'https:'].includes(u.protocol)) {
    throw new Error('Protocolo inválido');
  }

  const host = u.hostname.replace(/^\[|\]$/g, '');

  if (isPrivateIP(host)) {
    throw new Error('Acceso a IP interna bloqueado');
  }

  if (!/^[\d.]+$|:/.test(host) && host !== 'localhost') {
    const a = await Deno.resolveDns(host, "A").catch(() => []);
    const aaaa = await Deno.resolveDns(host, "AAAA").catch(() => []);
    const resolvedIps = [...a, ...aaaa];

    if (resolvedIps.length === 0) {
      throw new Error('Fallo en la resolución DNS');
    }

    if (resolvedIps.some(isPrivateIP)) {
      throw new Error('Acceso a IP interna bloqueado tras resolución DNS');
    }
  }

  const fetchOptions: RequestInit = {
    ...options,
    redirect: 'manual'
  };

  const response = await fetch(urlStr, fetchOptions);

  if ([301, 302, 303, 307, 308].includes(response.status)) {
    const location = response.headers.get('location');
    if (location) {
      response.body?.cancel();
      const newUrl = new URL(location, urlStr).toString();
      return safeFetch(newUrl, options);
    }
  }

  return response;
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
