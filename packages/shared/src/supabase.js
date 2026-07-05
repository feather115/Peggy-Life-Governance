import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseReady = !!(url && key && !url.includes('YOUR_PROJECT'));

const defaultAuth = { persistSession: true, autoRefreshToken: true };

// 注意：這裡刻意「不」提供模組載入時就建好的預設 client。
// 以前有一個 export const supabase = createClient(...) 的預設實例，沒有任何 app 用到，
// 卻讓每個 app 同時存在兩個 GoTrueClient（預設的 + createAppSupabase 建的），兩個都
// persist session 到同一個 storage key，console 一直噴「Multiple GoTrueClient instances」
// 警告。每個 app 只該有一個 client（自己 createAppSupabase 出來的那個）。

// For apps: pass their own db.schema so that all from()/rpc() calls automatically target this schema.
// auth shares the auth schema and is not affected by db.schema.
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
