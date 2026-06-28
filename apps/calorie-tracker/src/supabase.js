import { createAppSupabase, supabaseReady } from '@peggy-life/shared';

// 所有 from()/rpc() 都自動指向 calorie_tracker schema；auth 共用 auth schema。
export const supabase = createAppSupabase({ schema: 'calorie_tracker' });
export { supabaseReady };
