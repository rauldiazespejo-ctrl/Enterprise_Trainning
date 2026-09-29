import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DEFAULT_ALLOWED_ORIGINS = 'http://localhost:5173,http://localhost:3000,https://capacita-pro.vercel.app';

const getAllowedOrigins = (): string[] => {
  const envOrigins = Deno.env.get('ALLOWED_ORIGINS');
  return envOrigins ? envOrigins.split(',').map(o => o.trim()) : DEFAULT_ALLOWED_ORIGINS.split(',');
};

const isOriginAllowed = (origin: string | null): boolean => {
  if (!origin) return false;
  return getAllowedOrigins().includes(origin);
};

const buildCorsHeaders = (origin: string | null): Record<string, string> => {
  const allowedOrigin = isOriginAllowed(origin) ? origin : '';
  return {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
};

interface AuditLogEntry {
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, unknown>;
}

Deno.serve(async request => {
  const origin = request.headers.get('origin');
  const corsHeaders = buildCorsHeaders(origin);

  if (origin && !isOriginAllowed(origin)) {
    return Response.json(
      { error: 'Origen no permitido.' },
      { status: 403, headers: corsHeaders }
    );
  }

  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Cliente admin para insertar sin restricciones de RLS
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const body: AuditLogEntry & { user_id?: string } = await request.json();

    const { action, resource_type, resource_id, details, user_id: bodyUserId } = body;

    if (!action || !resource_type) {
      throw new Error('action y resource_type son requeridos.');
    }

    let user_id = bodyUserId;
    const unauthenticatedActions = ['login_failed', 'login', 'logout', 'signup'];

    // 🛡️ SECURITY: Prevent IDOR/Spoofing by verifying the user through the Authorization header.
    // Do not trust the user_id provided in the request body for authenticated actions.
    const authHeader = request.headers.get('Authorization');
    let isAuthenticated = false;

    if (authHeader) {
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const authClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user } } = await authClient.auth.getUser();
      if (user) {
        user_id = user.id; // Override with securely verified user ID
        isAuthenticated = true;
      }
    }

    // Fallback securely for unauthenticated actions, otherwise reject
    if (!isAuthenticated && !unauthenticatedActions.includes(action)) {
      throw new Error('Sesión requerida.');
    }

    // Obtener información del cliente
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('cf-connecting-ip')
      || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Insertar el log de auditoría
    const { error } = await adminClient.from('audit_log').insert({
      user_id: user_id || null,
      action: action as any,
      resource_type: resource_type as any,
      resource_id: resource_id || null,
      details: details || null,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    if (error) {
      console.error('[audit-log] Error inserting audit log:', error);
      throw new Error('No se pudo registrar el evento de auditoría.');
    }

    return Response.json(
      { success: true, message: 'Evento registrado.' },
      { headers: corsHeaders }
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Error inesperado.' },
      { status: 400, headers: corsHeaders }
    );
  }
});
