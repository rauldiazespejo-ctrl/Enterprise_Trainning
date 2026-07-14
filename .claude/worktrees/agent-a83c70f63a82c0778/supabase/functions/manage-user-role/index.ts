import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
};

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization) throw new Error('Sesión requerida.');

    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const callerClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
    const adminClient = createClient(url, serviceRoleKey);

    // Verificar que el caller es super_admin
    const { data: { user } } = await callerClient.auth.getUser();
    if (!user) throw new Error('Sesión inválida.');

    const { data: caller } = await adminClient.from('profiles').select('role').eq('id', user.id).single();
    if (!caller || caller.role !== 'super_admin') throw new Error('Solo el Super Administrador puede ejecutar esta acción.');

    const { action, userId, newPassword, newRole } = await request.json();

    if (action === 'reset_password') {
      if (!userId || !newPassword) throw new Error('userId y newPassword son requeridos.');
      if (newPassword.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');
      const { error } = await adminClient.auth.admin.updateUserById(userId, { password: newPassword });
      if (error) throw new Error(error.message);
      return Response.json({ success: true, message: 'Contraseña actualizada.' }, { headers: corsHeaders });
    }

    if (action === 'change_role') {
      if (!userId || !newRole) throw new Error('userId y newRole son requeridos.');
      if (!['admin', 'employee'].includes(newRole)) throw new Error('Rol inválido. Use admin o employee.');
      // Verificar que no está cambiando a otro super_admin
      const { data: target } = await adminClient.from('profiles').select('role').eq('id', userId).single();
      if (target?.role === 'super_admin') throw new Error('No se puede modificar el rol de un Super Admin.');
      const { error } = await adminClient.from('profiles').update({ role: newRole }).eq('id', userId);
      if (error) throw new Error(error.message);
      return Response.json({ success: true, message: `Rol actualizado a ${newRole}.` }, { headers: corsHeaders });
    }

    throw new Error(`Acción desconocida: ${action}`);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Error inesperado.' },
      { status: 400, headers: corsHeaders }
    );
  }
});
