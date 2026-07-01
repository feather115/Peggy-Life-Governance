import { createAppSupabase, supabaseReady } from '@peggy-life/shared';

// 所有 from()/rpc() 都自動指向 calendar schema。
export const supabase = createAppSupabase({ schema: 'calendar' });
export { supabaseReady };
