// 伺服器端專用的 Supabase admin client（service_role key 可以繞過所有 RLS）
// 絕對不能加 VITE_ 前綴、絕對不能在前端程式碼匯入這個檔案
import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('伺服器未設定 SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'calorie_tracker' },
  });
}
