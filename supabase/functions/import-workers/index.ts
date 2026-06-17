import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
};

// ─── Rate Limiter: 10 req/min per IP ─────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

const checkRateLimit = (clientIp: string): { allowed: boolean; remaining: number; resetIn: number } => {
  const now = Date.now();
  const entry = rateLimitMap.get(clientIp);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(clientIp, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetIn: RATE_WINDOW_MS };
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT - entry.count, resetIn: entry.resetAt - now };
};

const getClientIp = (request: Request): string => {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('cf-connecting-ip') ||
         'unknown';
};

const randomPassword = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return `${Array.from(bytes, value => value.toString(36).slice(-1)).join('')}A7!`;
};

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Rate limiting
  const clientIp = getClientIp(request);
  const rateCheck = checkRateLimit(clientIp);
  const rateLimitHeaders = {
    ...corsHeaders,
    'X-RateLimit-Limit': String(RATE_LIMIT),
    'X-RateLimit-Remaining': String(rateCheck.remaining),
    'X-RateLimit-Reset': String(Math.ceil(rateCheck.resetIn / 1000)),
  };
  if (!rateCheck.allowed) {
    return Response.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.' },
      { status: 429, headers: rateLimitHeaders }
    );
  }

  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization) throw new Error('Sesión requerida.');

    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const callerClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
    const adminClient = createClient(url, serviceRoleKey);

    const { data: { user } } = await callerClient.auth.getUser();
    if (!user) throw new Error('Sesión inválida.');

    const { data: caller } = await adminClient
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();
    if (!caller || !['admin', 'super_admin'].includes(caller.role)) throw new Error('Solo un administrador puede importar trabajadores.');

    const { workers } = await request.json();
    if (!Array.isArray(workers) || workers.length === 0 || workers.length > 500) {
      throw new Error('La lista de trabajadores no es válida.');
    }

    const credentials = [];
    for (const worker of workers) {
      const password = worker.password || randomPassword();
      const { data, error } = await adminClient.auth.admin.createUser({
        email: worker.email,
        password,
        email_confirm: true,
        user_metadata: { name: worker.name, role: 'employee' },
      });
      if (error || !data.user) throw new Error(`No se pudo crear ${worker.name}: ${error?.message}`);

      const { error: profileError } = await adminClient.from('profiles').insert({
        id: data.user.id,
        organization_id: caller.organization_id,
        rut: worker.rut,
        email: worker.email,
        name: worker.name,
        role: 'employee',
        department: worker.department,
        position: worker.position,
        status: 'active',
      });
      if (profileError) {
        await adminClient.auth.admin.deleteUser(data.user.id);
        throw new Error(`No se pudo guardar ${worker.name}: ${profileError.message}`);
      }
      credentials.push({ rut: worker.rut, name: worker.name, email: worker.email, password });
    }

    return Response.json({ imported: credentials.length, credentials }, { headers: rateLimitHeaders });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Error inesperado.' },
      { status: 400, headers: rateLimitHeaders }
    );
  }
});
