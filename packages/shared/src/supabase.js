import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseReady = !!(url && key && !url.includes('YOUR_PROJECT'));

export const supabase = supabaseReady
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

export function createSupabaseClient(options) {
  if (!supabaseReady) return null;
  return createClient(url, key, options);
}
