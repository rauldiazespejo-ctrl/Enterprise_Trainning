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

    // SSRF Protection Function
    const validateUrl = async (targetUrl: string, redirectCount: number = 0): Promise<string> => {
      if (redirectCount > 5) throw new Error("Too many redirects");

      let parsed: URL;
      try {
        parsed = new URL(targetUrl);
      } catch {
        throw new Error("URL inválida");
      }

      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error("Protocolo no permitido");
      }

      // Check if hostname is an IP (v4 or v6)
      const hostname = parsed.hostname;
      const isIpHostname = hostname.includes(':') || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);

      const isPrivateIP = (ip: string) => {
        const v = ip.replace(/^(\[)|(\])$/g, '').toLowerCase();
        if (v.includes(':')) return v === '::1' || v === '::' || /^(fc|fd|fe80|::ffff:)/.test(v);
        if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(v)) return v === 'localhost';
        return /^127\.|^10\.|^192\.168\.|^172\.(1[6-9]|2[0-9]|3[0-1])\.|^169\.254\.|^0\./.test(v);
      };

      if (isPrivateIP(hostname) || hostname.endsWith('.local') || hostname === 'localhost') {
        throw new Error("Acceso a red interna no permitido");
      }

      // Prevent DNS rebinding by resolving DNS if it's not already an IP
      // Note: fetching the hostname later leaves a TOCTOU vulnerability but standard fetch doesn't support custom SNI over IP.
      if (!isIpHostname) {
        // Resolve IPv4
        try {
          const recordsA = await Deno.resolveDns(hostname, 'A');
          for (const ip of recordsA) {
            if (isPrivateIP(ip)) throw new Error("Resolves to private IP");
          }
        } catch (e: unknown) {
           const err = e as Error;
           if (err.message?.includes("Resolves to private IP")) throw e;
           if (err.name !== "NotFound" && err.name !== "NotSupported") {
               throw new Error("Error de resolución DNS IPv4"); // Fail closed
           }
        }
        // Resolve IPv6
        try {
           const recordsAAAA = await Deno.resolveDns(hostname, 'AAAA');
           for (const ip of recordsAAAA) {
             if (isPrivateIP(ip)) throw new Error("Resolves to private IP");
           }
        } catch (e: unknown) {
           const err = e as Error;
           if (err.message?.includes("Resolves to private IP")) throw e;
           if (err.name !== "NotFound" && err.name !== "NotSupported") {
               throw new Error("Error de resolución DNS IPv6"); // Fail closed
           }
        }
      }
      return parsed.toString();
    };

    let currentUrl = await validateUrl(url);

    console.log(`Buscando contenido de: ${currentUrl}`);
    
    // Configurar headers para parecer un navegador
    const fetchHeaders = new Headers({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
    });

    let response;
    let redirectCount = 0;

    // Manual redirect tracking to prevent SSRF bypass via redirects
    while (true) {
      if (redirectCount > 5) throw new Error("Too many redirects");

      response = await fetch(currentUrl, {
        headers: fetchHeaders,
        redirect: 'manual'
      });

      if (response.status >= 300 && response.status < 400 && response.headers.has('location')) {
        const location = response.headers.get('location');
        if (!location) break;
        response.body?.cancel(); // Important to release resources
        currentUrl = await validateUrl(new URL(location, currentUrl).toString(), redirectCount + 1);
        redirectCount++;
      } else {
        break;
      }
    }
    
    if (!response.ok) {
      response.body?.cancel();
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
