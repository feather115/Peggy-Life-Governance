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

// Default admin client — points at this app's own schema (calendar)
export function getSupabaseAdmin() {
  return adminClientForSchema('calendar');
}

// Admin client for line_links (LINE 身份 ↔ Supabase 帳號對照，跨 app 共用）。
// 目前這個 Supabase 專案沒辦法 expose 新的 shared schema（見 docs/new-app-sop.md 的坑清單），
// 所以沿用其他 app 的做法：line_links 實際存在 calorie_tracker schema。
export function getSupabaseAdminForLine() {
  return adminClientForSchema('calorie_tracker');
}
