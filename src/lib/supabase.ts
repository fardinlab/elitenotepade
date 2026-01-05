import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://evcxopgdkkivlinjltdz.supabase.co';
const supabaseAnonKey = 'sb_publishable_vbMguK56zKwjTAzgy8bbbw_qDY3Vw3h';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
