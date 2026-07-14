import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
};

interface AuditLogEntry {
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, unknown>;
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Cliente admin para insertar sin restricciones de RLS
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const body: AuditLogEntry & { user_id?: string } = await request.json();

    const { action, resource_type, resource_id, details, user_id } = body;

    if (!action || !resource_type) {
      throw new Error('action y resource_type son requeridos.');
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
