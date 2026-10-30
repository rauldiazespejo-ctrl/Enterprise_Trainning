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

const isPrivateIP = (ip: string): boolean => {
  const cleanIp = ip.replace(/^\[/, '').replace(/\]$/, '');
  const privateIPv4 = /^(0\.|10\.|127\.|169\.254\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|224\.|240\.|255\.255\.255\.255)/;
  const privateIPv6 = /^(::1$|fc00:|fe80:|fd)/i;
  return privateIPv4.test(cleanIp) || privateIPv6.test(cleanIp);
};

const resolveAndValidateUrl = async (urlString: string): Promise<string> => {
  const parsedUrl = new URL(urlString);

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('Solo se permiten URLs http/https');
  }

  // If the hostname is already an IP, validate it immediately
  if (isPrivateIP(parsedUrl.hostname)) {
    throw new Error("El acceso a IPs internas no está permitido");
  }

  const checkDns = async (recordType: "A" | "AAAA") => {
    try {
      const records = await Deno.resolveDns(parsedUrl.hostname, recordType);
      for (const ip of records) {
        if (isPrivateIP(ip)) {
          throw new Error("El acceso a IPs internas no está permitido");
        }
      }
    } catch (error) {
      // Re-throw if it's our internal IP restriction error
      if (error instanceof Error && error.message.includes('internas')) throw error;
      // Other DNS errors (e.g., NotFound) are swallowed so we don't crash if an AAAA record doesn't exist.
    }
  };

  // Check both IPv4 and IPv6 resolution to block any internal routing
  await checkDns("A");
  await checkDns("AAAA");

  return urlString;
};

const safeFetch = async (url: string, options: RequestInit, maxRedirects = 5): Promise<Response> => {
  let currentUrl = url;

  for (let i = 0; i < maxRedirects; i++) {
    await resolveAndValidateUrl(currentUrl);

    const response = await fetch(currentUrl, {
      ...options,
      redirect: 'manual'
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (response.body) {
        await response.body.cancel();
      }

      if (!location) {
        throw new Error('Redirect sin location header');
      }
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    return response;
  }

  throw new Error('Demasiados redireccionamientos');
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

    // 🛡️ Sentinel: Fix SSRF vulnerability - use safeFetch instead of raw fetch
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
