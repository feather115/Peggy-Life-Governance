// Server-side dedicated Supabase admin client (the service_role key can bypass all RLS policies).
// NEVER prefix the service key with VITE_, and NEVER import this file in frontend code.
import { createClient } from '@supabase/supabase-js';

function adminClientForSchema(schema) {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('伺服器未設定 SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema },
  });
}

// Default admin client — points at this app's own schema (recipe_book)
export function getSupabaseAdmin() {
  return adminClientForSchema('recipe_book');
}

// Admin client for line_links. TEMPORARY: should live in a `shared` schema,
// but Supabase's Data API on this project won't expose `shared` (PGRST106
// persists even with db_schema confirmed correct via Management API + restarts).
// Reverted to calorie_tracker (already exposed, confirmed working) until that's resolved.
// See packages/shared/supabase/2026-06-29_line_links_revert_to_calorie_tracker.sql
export function getSupabaseAdminForLine() {
  return adminClientForSchema('calorie_tracker');
}
