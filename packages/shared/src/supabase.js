import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseReady = !!(url && key && !url.includes('YOUR_PROJECT'));

const defaultAuth = { persistSession: true, autoRefreshToken: true };

// 預設 client（public schema）。沒指定 schema 的場景使用。
export const supabase = supabaseReady
  ? createClient(url, key, { auth: defaultAuth })
  : null;

// 給各 app 用：傳入它自己的 db.schema，所有 from()/rpc() 自動指向該 schema。
// auth 共用 auth schema，不受 db.schema 影響。
export function createAppSupabase(options = {}) {
  if (!supabaseReady) return null;
  const { schema, db, auth, ...rest } = options;
  return createClient(url, key, {
    ...rest,
    auth: { ...defaultAuth, ...(auth || {}) },
    db: schema ? { schema, ...(db || {}) } : db,
  });
}

export function createSupabaseClient(options) {
  return createAppSupabase(options);
}
