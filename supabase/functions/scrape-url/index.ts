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

const isPrivateIp = (ip: string): boolean => {
  const ipv4Match = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4Match) {
    const [_, p1, p2, p3, p4] = ipv4Match.map(Number);
    if (
      p1 === 10 ||
      (p1 === 172 && p2 >= 16 && p2 <= 31) ||
      (p1 === 192 && p2 === 168) ||
      p1 === 127 ||
      p1 === 0 ||
      (p1 === 169 && p2 === 254)
    ) {
      return true;
    }
  }

  if (ip.includes(':')) {
    const cleanIpv6 = ip.replace(/^\[|\]$/g, '').toLowerCase();
    if (
      cleanIpv6 === '::1' ||
      cleanIpv6 === '::' ||
      cleanIpv6.startsWith('fc') ||
      cleanIpv6.startsWith('fd') ||
      cleanIpv6.startsWith('fe80') ||
      cleanIpv6.startsWith('::ffff:')
    ) {
      return true;
    }
  }

  return false;
};

const validateUrl = async (urlStr: string): Promise<void> => {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlStr);
  } catch (e) {
    throw new Error('Invalid URL format');
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('Solo se permiten protocolos HTTP/HTTPS');
  }

  const hostname = parsedUrl.hostname;

  if (hostname === 'localhost' || isPrivateIp(hostname)) {
    throw new Error('Buscando contenido en redes privadas no está permitido (SSRF prevention)');
  }

  const ips: string[] = [];
  try {
    const aRecords = await Deno.resolveDns(hostname, 'A');
    ips.push(...aRecords);
  } catch (e) {
    // Ignore, might not have A records
  }
  try {
    const aaaaRecords = await Deno.resolveDns(hostname, 'AAAA');
    ips.push(...aaaaRecords);
  } catch (e) {
    // Ignore, might not have AAAA records
  }

  if (ips.length === 0 && !isPrivateIp(hostname)) {
    // If we can't resolve it and it's not a raw IP, it's safer to block or let fetch fail.
    // We let fetch fail natively if DNS is totally unresolvable.
  }

  for (const ip of ips) {
    if (isPrivateIp(ip)) {
      throw new Error(`Hostname resuelve a IP privada: ${ip} (SSRF prevention)`);
    }
  }
};

const safeFetch = async (urlStr: string, options?: RequestInit, maxRedirects = 5): Promise<Response> => {
  let currentUrl = urlStr;
  let currentRedirects = 0;

  while (currentRedirects < maxRedirects) {
    await validateUrl(currentUrl);

    // Document TOCTOU: We validate DNS, then fetch uses the hostname again.
    const res = await fetch(currentUrl, {
      ...options,
      redirect: 'manual'
    });

    if (res.status >= 300 && res.status < 400 && res.headers.has('location')) {
      const location = res.headers.get('location')!;
      await res.body?.cancel();
      currentUrl = new URL(location, currentUrl).toString();
      currentRedirects++;
    } else {
      return res;
    }
  }
  throw new Error('Too many redirects');
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
