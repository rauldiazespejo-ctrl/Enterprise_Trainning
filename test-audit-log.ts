import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = 'https://example.com';
const serviceRoleKey = 'test';
const authClient = createClient(supabaseUrl, serviceRoleKey);
console.log(typeof authClient.auth.getUser);
