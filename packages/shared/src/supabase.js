import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseReady = !!(url && key && !url.includes('YOUR_PROJECT'));

const defaultAuth = { persistSession: true, autoRefreshToken: true };

// Default client (public schema). Used in scenarios where no schema is specified.
export const supabase = supabaseReady
  ? createClient(url, key, { auth: defaultAuth })
  : null;

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
