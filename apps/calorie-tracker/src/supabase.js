import { createAppSupabase, supabaseReady } from '@peggy-life/shared';

// All from()/rpc() calls automatically point to the calorie_tracker schema; auth shares the common auth schema.
export const supabase = createAppSupabase({ schema: 'calorie_tracker' });
export { supabaseReady };
