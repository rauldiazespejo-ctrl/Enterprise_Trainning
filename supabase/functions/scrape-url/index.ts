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

// --- SSRF Mitigation ---
const isBlockedHostname = (hostname: string): boolean => {
  const blocked = [
    'localhost',
    '169.254.169.254',
  ];
  if (blocked.includes(hostname) || hostname.endsWith('.local')) return true;
  return false;
};

const isPrivateIP = (ip: string): boolean => {
  // IPv6 Checks
  if (ip.includes(':')) {
    if (ip === '::1' || ip === '::') return true;
    const lowerIP = ip.toLowerCase();
    // Unique Local (fc00::/7)
    if (lowerIP.startsWith('fc') || lowerIP.startsWith('fd')) return true;
    // Link Local (fe80::/10)
    if (lowerIP.startsWith('fe8') || lowerIP.startsWith('fe9') || lowerIP.startsWith('fea') || lowerIP.startsWith('feb')) return true;
    // Cloud Metadata IPv6 or other explicit targets
    if (lowerIP.includes('fd00:ec2::254')) return true;
    // IPv4-mapped IPv6
    if (lowerIP.startsWith('::ffff:')) {
       return isPrivateIP(lowerIP.replace('::ffff:', ''));
    }
    return false;
  }

  // IPv4 Checks
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = ip.match(ipv4Regex);
  if (!match) return false;

  const [_, p1, p2] = match;
  const n1 = parseInt(p1, 10);
  const n2 = parseInt(p2, 10);

  if (n1 === 0) return true;   // 0.0.0.0/8
  if (n1 === 127) return true; // 127.0.0.0/8
  if (n1 === 10) return true;  // 10.0.0.0/8
  if (n1 === 172 && n2 >= 16 && n2 <= 31) return true; // 172.16.0.0/12
  if (n1 === 192 && n2 === 168) return true; // 192.168.0.0/16
  if (n1 === 169 && n2 === 254) return true; // 169.254.0.0/16 (Link local / Cloud metadata)

  return false;
};

const validateUrlAndResolve = async (targetUrl: string): Promise<void> => {
  const parsed = new URL(targetUrl);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Solo se permiten protocolos HTTP/HTTPS.');
  }

  // Remove brackets for IPv6 hostname resolution check
  const hostname = parsed.hostname.replace(/^\[|\]$/g, '');

  if (isBlockedHostname(hostname)) {
    throw new Error('Acceso a hostname bloqueado.');
  }

  if (isPrivateIP(hostname)) {
    throw new Error('Acceso a IP privada denegado.');
  }

  // Deno DNS resolution to prevent DNS Rebinding (TOCTOU limitation applies)
  try {
    const v4 = await Deno.resolveDns(hostname, 'A').catch(() => []);
    const v6 = await Deno.resolveDns(hostname, 'AAAA').catch(() => []);
    const ips = [...v4, ...v6];

    if (ips.some(isPrivateIP)) {
      throw new Error('El dominio resuelve a una IP interna reservada.');
    }
  } catch (error) {
    if (error.message.includes('IP interna')) throw error;
    // If DNS resolution completely fails, let the fetch attempt fail naturally
  }
};

const safeFetch = async (targetUrl: string, options?: RequestInit, maxHops = 3): Promise<Response> => {
  let currentUrl = targetUrl;
  let currentOptions = options ? { ...options, redirect: 'manual' as RequestRedirect } : { redirect: 'manual' as RequestRedirect };

  for (let hop = 0; hop <= maxHops; hop++) {
    await validateUrlAndResolve(currentUrl);

    const response = await fetch(currentUrl, currentOptions);

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) return response; // Cannot follow

      const parsedLocation = new URL(location, currentUrl);
      currentUrl = parsedLocation.toString();

      // Clear body for 303 or standard redirection changes
      if (response.status === 303 || ((response.status === 301 || response.status === 302) && currentOptions.method === 'POST')) {
         currentOptions = { ...currentOptions, method: 'GET', body: undefined };
      }

      continue;
    }

    return response;
  }

  throw new Error('Demasiadas redirecciones.');
};
// ----------------------

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
