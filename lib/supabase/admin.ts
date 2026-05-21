import { createClient } from '@supabase/supabase-js';

// Admin Supabase client — uses the service role key and bypasses RLS.
// SERVER-SIDE ONLY. Never import this into a client component.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}