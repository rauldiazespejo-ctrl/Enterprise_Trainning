import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Allowed origins for CORS validation
const DEFAULT_ALLOWED_ORIGINS = 'http://localhost:5173,http://localhost:3000,https://capacita-pro.vercel.app';

const isInternalIP = (ip: string) => {
  const isLocalhost = ip === 'localhost';
  const ipv4 = /^(127\.\d{1,3}\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|169\.254\.\d{1,3}\.\d{1,3}|0\.\d{1,3}\.\d{1,3}\.\d{1,3})$/;
  const ipv6 = /^(::1|fd[0-9a-f]{2}:.+|fe80::.+)$/i;
  return isLocalhost || ipv4.test(ip) || ipv6.test(ip);
};

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
    const { url: originalUrl } = await req.json();

    if (!originalUrl) {
      throw new Error("Se requiere una URL válida");
    }

    // Check original url first
    const urlObj = new URL(originalUrl);
    const hostnameObj = urlObj.hostname.replace(/^\[|\]$/g, '');
    const resolvedIps: string[] = [];
    try {
        const ips4 = await Deno.resolveDns(hostnameObj, "A");
        resolvedIps.push(...ips4);
    } catch (e) {
        // ignore A record failure
    }
    try {
        const ips6 = await Deno.resolveDns(hostnameObj, "AAAA");
        resolvedIps.push(...ips6);
    } catch (e) {
        // ignore AAAA record failure
    }

    if (resolvedIps.length === 0) {
        resolvedIps.push(hostnameObj);
    }

    for (const ip of resolvedIps) {
        if (isInternalIP(ip)) {
            throw new Error(`URL no permitida`);
        }
    }

    console.log(`Buscando contenido de: ${originalUrl}`);
    
    // Configurar headers para parecer un navegador
    const fetchHeaders = new Headers({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
    });

    let currentUrl = originalUrl;
    let response;
    let redirectCount = 0;
    const MAX_REDIRECTS = 5;

    while (redirectCount < MAX_REDIRECTS) {
        response = await fetch(currentUrl, { headers: fetchHeaders, redirect: 'manual' });

        if (response.status >= 300 && response.status < 400) {
            await response.body?.cancel();
            const location = response.headers.get('location');
            if (!location) {
                break;
            }

            const nextUrl = new URL(location, currentUrl).toString();
            const nextUrlObj = new URL(nextUrl);
            const nextHostnameObj = nextUrlObj.hostname.replace(/^\[|\]$/g, '');

            const nextResolvedIps: string[] = [];
            try {
                const ips4 = await Deno.resolveDns(nextHostnameObj, "A");
                nextResolvedIps.push(...ips4);
            } catch (e) {
                // ignore A record failure
            }
            try {
                const ips6 = await Deno.resolveDns(nextHostnameObj, "AAAA");
                nextResolvedIps.push(...ips6);
            } catch (e) {
                // ignore AAAA record failure
            }

            if (nextResolvedIps.length === 0) {
                nextResolvedIps.push(nextHostnameObj);
            }

            for (const ip of nextResolvedIps) {
                if (isInternalIP(ip)) {
                    throw new Error(`URL redirigida no permitida`);
                }
            }
            currentUrl = nextUrl;
            redirectCount++;
        } else {
            break;
        }
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
