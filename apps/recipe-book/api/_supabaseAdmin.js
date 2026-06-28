// Server-side dedicated Supabase admin client (the service_role key can bypass all RLS policies).
// NEVER prefix the service key with VITE_, and NEVER import this file in frontend code.
import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('伺服器未設定 SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'recipe_book' },
  });
}
