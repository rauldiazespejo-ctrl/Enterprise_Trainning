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

const isInternalIp = (ip: string): boolean => {
  const ipv4Regex = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/;
  const match = ip.match(ipv4Regex);
  if (match) {
    const a = parseInt(match[1], 10);
    const b = parseInt(match[2], 10);
    if (
      a === 127 ||
      a === 10 ||
      a === 0 ||
      (a === 192 && b === 168) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 169 && b === 254)
    ) {
      return true;
    }
  }
  if (ip === '::1' || ip === '::' || ip.toLowerCase().startsWith('fe80:')) {
    return true;
  }
  return false;
}

const safeFetch = async (targetUrl: string, options: RequestInit): Promise<Response> => {
    const url = new URL(targetUrl);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('Protocolo no permitido');
    }

    const hostname = url.hostname;

    if (
      hostname === 'localhost' ||
      hostname.endsWith('.local')
    ) {
      throw new Error('URL destino no permitida (riesgo de SSRF)');
    }

    if (isInternalIp(hostname) || hostname === '[::1]' || hostname === '[::]') {
       throw new Error('URL destino no permitida (riesgo de SSRF)');
    }

    // Attempt to resolve DNS to prevent rebinding/custom DNS bypasses
    // Deno.resolveDns is available in Edge Functions
    try {
       const ips = await Deno.resolveDns(hostname, "A");
       if (ips.some(isInternalIp)) {
          throw new Error('La IP resuelta no está permitida (riesgo de SSRF)');
       }
    } catch (e: any) {
        if (e.message && e.message.includes('SSRF')) throw e;
        // If DNS resolution fails entirely, we might still want to try fetch as it could be an IP directly
        // Or it could be an IPv6 address, let's try AAAA
        try {
            const ipv6s = await Deno.resolveDns(hostname, "AAAA");
            if (ipv6s.some(isInternalIp)) {
                throw new Error('La IP resuelta no está permitida (riesgo de SSRF)');
            }
        } catch (e2: any) {
             if (e2.message && e2.message.includes('SSRF')) throw e2;
             // Continue if DNS throws (could be a raw IP)
        }
    }

    // Note: Deno's standard fetch handles redirects transparently.
    // While this implementation protects against direct IP/DNS SSRF,
    // a malicious server returning a 301/302 redirect to an internal IP
    // could still potentially bypass this. Full protection requires a custom HTTP client.

    return await fetch(targetUrl, options);

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
