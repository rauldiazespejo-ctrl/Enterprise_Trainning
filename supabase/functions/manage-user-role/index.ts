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
      const { data: target } = await adminClient.from('profiles').select('role').eq('id', userId).single();
      if (target?.role === 'super_admin') throw new Error('No se puede modificar el rol de un Super Admin.');
      const { error } = await adminClient.from('profiles').update({ role: newRole }).eq('id', userId);
      if (error) throw new Error(error.message);
      return Response.json({ success: true, message: `Rol actualizado a ${newRole}.` }, { headers: corsHeaders });
    }

    // ── Reset ALL users to RUT-based credentials ──
    if (action === 'reset_all_to_rut') {
      const { data: profiles, error: fetchError } = await adminClient
        .from('profiles')
        .select('id, rut, name, email, role')
        .neq('role', 'super_admin');

      if (fetchError) throw new Error(fetchError.message);
      if (!profiles || profiles.length === 0) {
        return Response.json({ success: true, updated: 0, skipped: 0, results: [] }, { headers: corsHeaders });
      }

      const normalizeRut = (rut: string): string =>
        rut.replace(/\./g, '').replace(/\s/g, '').toUpperCase();

      const rutBodyNoDv = (rut: string): string => {
        const clean = normalizeRut(rut);
        if (clean.includes('-')) return clean.split('-')[0];
        return clean.slice(0, -1);
      };

      const rutToEmail = (rut: string): string =>
        `${normalizeRut(rut).replace('-', '').toLowerCase()}@acceso.soldesp.cl`;

      const results: Array<{ name: string; rut: string; email: string; status: string }> = [];
      let updated = 0;
      let skipped = 0;

      for (const profile of profiles) {
        if (!profile.rut) {
          results.push({ name: profile.name, rut: '', email: profile.email, status: 'skipped-no-rut' });
          skipped++;
          continue;
        }

        const cleanRut = normalizeRut(profile.rut);
        const newEmail = rutToEmail(cleanRut);
        const newPass = rutBodyNoDv(cleanRut);

        try {
          // Update auth email + password
          const { error: authError } = await adminClient.auth.admin.updateUserById(profile.id, {
            email: newEmail,
            password: newPass,
          });
          if (authError) throw authError;

          // Update profile email + must_change_password
          await adminClient.from('profiles').update({
            email: newEmail,
            must_change_password: true,
          }).eq('id', profile.id);

          results.push({ name: profile.name, rut: profile.rut, email: newEmail, status: 'updated' });
          updated++;
        } catch (err: any) {
          results.push({ name: profile.name, rut: profile.rut, email: newEmail, status: `error: ${err.message}` });
          skipped++;
        }
      }

      return Response.json({ success: true, updated, skipped, results }, { headers: corsHeaders });
    }

    throw new Error(`Acción desconocida: ${action}`);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Error inesperado.' },
      { status: 400, headers: corsHeaders }
    );
  }
});
