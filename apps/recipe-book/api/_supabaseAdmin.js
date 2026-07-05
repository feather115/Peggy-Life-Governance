// Server-side dedicated Supabase admin client (the service_role key can bypass all RLS policies).
// NEVER prefix the service key with VITE_, and NEVER import this file in frontend code.
import { createClient } from '@supabase/supabase-js';

function adminClientForSchema(schema) {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw Object.assign(new Error('伺服器未設定 SUPABASE_SERVICE_ROLE_KEY'), { statusCode: 500 });
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema },
  });
}

// Default admin client — points at this app's own schema (recipe_book)
export function getSupabaseAdmin() {
  return adminClientForSchema('recipe_book');
}

// Admin client for the shared schema (line_links lives here, shared with calorie-tracker + calendar)
export function getSupabaseAdminForLine() {
  return adminClientForSchema('shared');
}
