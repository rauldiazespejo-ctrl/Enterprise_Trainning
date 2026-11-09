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

function isPrivateIP(ip: string): boolean {
  if (ip === 'localhost') return true;
  if (ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }
  const isIPv4 = ip.includes('.');
  if (isIPv4) {
    return (
      /^10\.\d+\.\d+\.\d+$/.test(ip) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(ip) ||
      /^192\.168\.\d+\.\d+$/.test(ip) ||
      /^127\.\d+\.\d+\.\d+$/.test(ip) ||
      /^169\.254\.\d+\.\d+$/.test(ip) ||
      ip === '0.0.0.0' ||
      ip === '255.255.255.255'
    );
  }
  const isIPv6 = ip.includes(':');
  if (isIPv6) {
    return (
      ip === '::1' ||
      ip.toLowerCase().startsWith('fc00:') ||
      ip.toLowerCase().startsWith('fd') ||
      ip.toLowerCase().startsWith('fe80:')
    );
  }
  return false;
}

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
    let response;
    let redirectCount = 0;
    const MAX_REDIRECTS = 5;

    while (redirectCount <= MAX_REDIRECTS) {
      const parsedUrl = new URL(currentUrl);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new Error('Only HTTP and HTTPS protocols are allowed');
      }

      let hostname = parsedUrl.hostname;
      if (hostname.startsWith('[') && hostname.endsWith(']')) {
        hostname = hostname.slice(1, -1);
      }

      if (isPrivateIP(hostname)) {
        throw new Error('Access to internal or private networks is forbidden');
      }

      const resolvedIps: string[] = [];
      const isIP = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname) || /^[0-9a-fA-F:]+$/.test(hostname);

      if (!isIP) {
        await Promise.all([
          Deno.resolveDns(hostname, 'A').catch(() => []),
          Deno.resolveDns(hostname, 'AAAA').catch(() => [])
        ]).then(([ipv4s, ipv6s]) => {
          resolvedIps.push(...ipv4s);
          resolvedIps.push(...ipv6s);
        });

        for (const ip of resolvedIps) {
          if (isPrivateIP(ip)) {
            throw new Error(`Resolved IP address ${ip} is restricted`);
          }
        }
      }

      response = await fetch(currentUrl, { headers: fetchHeaders, redirect: 'manual' });

      if (response.status >= 300 && response.status < 400 && response.headers.has('location')) {
        const locationUrl = new URL(response.headers.get('location')!, currentUrl).toString();
        if (response.body) await response.body.cancel();
        currentUrl = locationUrl;
        redirectCount++;
      } else {
        break;
      }
    }

    if (redirectCount > MAX_REDIRECTS) {
      throw new Error('Too many redirects');
    }
    
    if (!response || !response.ok) {
      if (response?.body) await response.body.cancel();
      throw new Error(`Error al acceder a la URL: ${response ? response.statusText : 'Unknown'}`);
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
