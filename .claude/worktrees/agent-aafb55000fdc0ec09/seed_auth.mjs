import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vyumcxkjetzalvnebgqi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5dW1jeGtqZXR6YWx2bmViZ3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMTI1MzcsImV4cCI6MjA5NjU4ODUzN30.3xwaIo56JaoVU4FxIAgPNn6nq1GgSSvxcpeWoIbtY8I';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
  console.log('Seeding admin...');
  const { data: admin, error: adminErr } = await supabase.auth.signUp({
    email: 'demo_admin@capacitapro.com',
    password: 'admin123',
    options: {
      data: { name: 'Administrador Demo', role: 'admin' }
    }
  });
  console.log('Admin:', adminErr ? adminErr.message : 'Created', admin?.user?.id || '');

  console.log('Seeding employee...');
  const { data: emp, error: empErr } = await supabase.auth.signUp({
    email: 'demo_empleado@capacitapro.com',
    password: 'empleado123',
    options: {
      data: { name: 'Empleado Demo', role: 'employee' }
    }
  });
  console.log('Employee:', empErr ? empErr.message : 'Created', emp?.user?.id || '');
}

seed();
