import { createAppSupabase, supabaseReady } from '@peggy-life/shared';

// 所有 from() 都自動指向 recipe_book schema。
export const supabase = createAppSupabase({ schema: 'recipe_book' });
export { supabaseReady };
