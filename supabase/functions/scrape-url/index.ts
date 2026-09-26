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

    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      throw new Error("Formato de URL inválido");
    }

    if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
      throw new Error("Protocolo no permitido. Solo HTTP y HTTPS.");
    }

    const isReservedIP = (ip: string) => {
      const parts = ip.split('.').map(Number);
      if (parts.length !== 4) return false;
      return (
        parts[0] === 10 ||
        parts[0] === 127 ||
        parts[0] === 0 ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
        (parts[0] === 192 && parts[1] === 168) ||
        (parts[0] === 169 && parts[1] === 254)
      );
    };

    const isReservedIPv6 = (ip: string) => {
      if (!ip.includes(':')) return false;
      const lower = ip.toLowerCase();
      // Remove brackets if present
      const cleanIp = lower.replace(/^\[/, '').replace(/\]$/, '');
      return (
        cleanIp === '::1' ||
        cleanIp === '::' ||
        cleanIp.startsWith('fc') ||
        cleanIp.startsWith('fd') ||
        cleanIp.startsWith('fe80') ||
        cleanIp.startsWith('::ffff:')
      );
    };

    const isInternalHostname = (hostname: string) => {
      const lower = hostname.toLowerCase();
      return (
        lower === 'localhost' ||
        lower.endsWith('.localhost') ||
        lower.endsWith('.local') ||
        lower.endsWith('.internal') ||
        lower === 'metadata.google.internal' ||
        lower === '169.254.169.254'
      );
    };

    const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(targetUrl.hostname) || targetUrl.hostname.includes(':');

    if (isInternalHostname(targetUrl.hostname)) {
      throw new Error("Host no permitido.");
    }

    if (isIP) {
      if (isReservedIP(targetUrl.hostname) || isReservedIPv6(targetUrl.hostname)) {
         throw new Error("Dirección IP no permitida.");
      }
    } else {
      // It's a hostname, resolve it to check for DNS rebinding to internal IPs
      try {
        const ipv4s = await Deno.resolveDns(targetUrl.hostname, "A").catch((e) => {
           if (e instanceof Deno.errors.NotFound || e instanceof Deno.errors.NotSupported) return [];
           throw e;
        });
        const ipv6s = await Deno.resolveDns(targetUrl.hostname, "AAAA").catch((e) => {
           if (e instanceof Deno.errors.NotFound || e instanceof Deno.errors.NotSupported) return [];
           throw e;
        });

        for (const ip of ipv4s) {
          if (isReservedIP(ip)) throw new Error("Resolución a IP no permitida.");
        }
        for (const ip of ipv6s) {
          if (isReservedIPv6(ip)) throw new Error("Resolución a IP no permitida.");
        }
      } catch (error) {
        if (error instanceof Error && error.message === "Resolución a IP no permitida.") throw error;
        throw new Error("Error resolviendo el hostname.");
      }
    }


    const validateUrl = async (urlStr: string): Promise<URL> => {
      let target: URL;
      try {
        target = new URL(urlStr);
      } catch {
        throw new Error("Formato de URL de redirección inválido");
      }

      if (target.protocol !== "http:" && target.protocol !== "https:") {
        throw new Error("Protocolo no permitido en redirección.");
      }

      const isInternal = isInternalHostname(target.hostname);
      if (isInternal) {
        throw new Error("Host no permitido en redirección.");
      }

      const isIPAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(target.hostname) || target.hostname.includes(':');

      if (isIPAddress) {
        if (isReservedIP(target.hostname) || isReservedIPv6(target.hostname)) {
           throw new Error("Dirección IP no permitida en redirección.");
        }
      } else {
        try {
          const ipv4s = await Deno.resolveDns(target.hostname, "A").catch((e) => {
             if (e instanceof Deno.errors.NotFound || e instanceof Deno.errors.NotSupported) return [];
             throw e;
          });
          const ipv6s = await Deno.resolveDns(target.hostname, "AAAA").catch((e) => {
             if (e instanceof Deno.errors.NotFound || e instanceof Deno.errors.NotSupported) return [];
             throw e;
          });

          for (const ip of ipv4s) {
            if (isReservedIP(ip)) throw new Error("Resolución a IP no permitida.");
          }
          for (const ip of ipv6s) {
            if (isReservedIPv6(ip)) throw new Error("Resolución a IP no permitida.");
          }
        } catch (error) {
        if (error instanceof Error && error.message === "Resolución a IP no permitida.") throw error;
          throw new Error("Error resolviendo el hostname en redirección.");
        }
      }
      return target;
    };


    console.log(`Buscando contenido de: ${url}`);
    
    // Configurar headers para parecer un navegador
    const fetchHeaders = new Headers({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
    });

    let currentUrl = targetUrl;
    let redirectsCount = 0;
    const MAX_REDIRECTS = 5;
    let response: Response | null = null;

    while (redirectsCount <= MAX_REDIRECTS) {
      response = await fetch(currentUrl.toString(), {
        headers: fetchHeaders,
        redirect: 'manual'
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        response.body?.cancel();

        if (!location) {
          throw new Error("Redirección sin encabezado Location.");
        }

        redirectsCount++;
        if (redirectsCount > MAX_REDIRECTS) {
          throw new Error("Demasiadas redirecciones.");
        }

        currentUrl = await validateUrl(new URL(location, currentUrl).toString());
      } else {
        break; // Not a redirect, process this response
      }
    }

    if (!response || !response.ok) {
      response?.body?.cancel();
      throw new Error(`Error al acceder a la URL: ${response?.statusText || "No response"}`);
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
