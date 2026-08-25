import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Public read (no auth) — relies on the RLS policy "Public read access for app_data"
// allowing anonymous SELECT. Session persistence is not needed for reads.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});
