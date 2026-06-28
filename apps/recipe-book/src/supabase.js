import { createAppSupabase, supabaseReady } from '@peggy-life/shared';

// All from() calls automatically point to the recipe_book schema.
export const supabase = createAppSupabase({ schema: 'recipe_book' });
export { supabaseReady };
