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

    // SSRF Protection: Validate URL and Protocol
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error("Protocolo no permitido. Solo HTTP y HTTPS son soportados.");
    }

    const isForbiddenIpOrHost = (host: string) => {
      const isInternalRegex = /^(?:127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[0-1])\.\d+\.\d+|0\.\d+\.\d+\.\d+|169\.254\.169\.254)$/;
      return isInternalRegex.test(host) || host === 'localhost' || host === '[::1]' || host === '[::]' || host.endsWith('.local');
    };

    if (isForbiddenIpOrHost(parsedUrl.hostname)) {
      throw new Error("Destino no permitido.");
    }

    // SSRF Protection: DNS Rebinding for IPv4 and IPv6
    // (TOCTOU warning: standard fetch API limitation without custom agent)
    const checkDns = async (hostname: string) => {
      try {
        const recordsA = await Deno.resolveDns(hostname, 'A');
        for (const ip of recordsA) {
          if (isForbiddenIpOrHost(ip)) throw new Error("Destino IP no permitido (IPv4).");
        }
      } catch (e: any) {
        if (e.message === "Destino IP no permitido (IPv4).") throw e;
      }
      try {
        const recordsAAAA = await Deno.resolveDns(hostname, 'AAAA');
        for (const ip of recordsAAAA) {
          // Check if resolved IPv6 is loopback or similar
          if (ip === '::1' || ip === '::' || isForbiddenIpOrHost(ip)) throw new Error("Destino IP no permitido (IPv6).");
        }
      } catch (e: any) {
        if (e.message === "Destino IP no permitido (IPv6).") throw e;
      }
    };
    await checkDns(parsedUrl.hostname);

    console.log(`Buscando contenido de: ${parsedUrl.toString()}`);
    
    // Configurar headers para parecer un navegador
    const fetchHeaders = new Headers({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
    });

    // Custom fetch loop to safely follow redirects
    let currentUrl = parsedUrl.toString();
    let response: Response | null = null;
    let redirectCount = 0;
    const MAX_REDIRECTS = 5;

    while (redirectCount <= MAX_REDIRECTS) {
      response = await fetch(currentUrl, {
        headers: fetchHeaders,
        redirect: 'manual'
      });

      if (response.status >= 300 && response.status < 400 && response.headers.has('location')) {
        const redirectLocation = response.headers.get('location')!;
        let nextUrl: URL;
        try {
          nextUrl = new URL(redirectLocation, currentUrl);
        } catch {
          throw new Error("Location de redirección inválida.");
        }

        if (nextUrl.protocol !== 'http:' && nextUrl.protocol !== 'https:') {
          throw new Error("Protocolo de redirección no permitido.");
        }
        if (isForbiddenIpOrHost(nextUrl.hostname)) {
          throw new Error("Destino de redirección no permitido.");
        }
        await checkDns(nextUrl.hostname);

        currentUrl = nextUrl.toString();
        redirectCount++;
      } else {
        break; // No more redirects
      }
    }

    if (!response) {
      throw new Error(`Error inesperado al acceder a la URL`);
    }

    if (redirectCount > MAX_REDIRECTS) {
      throw new Error(`Demasiadas redirecciones`);
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
