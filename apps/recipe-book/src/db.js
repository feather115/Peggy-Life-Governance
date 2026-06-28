// Pure fetch functions for Supabase; components do not communicate with the database directly, but use the state/actions returned by useRecipes.
import { supabase } from './supabase.js';
import { normalizeRecipe } from './utils.js';

const RECIPE_SELECT_COLUMNS = [
  'id',
  'title',
  'category',
  'ingredients',
  'steps',
  'notes',
  'image_url',
  'last_cooked_at',
  'yield_info',
  'parameters',
].join(', ');

export async function loadRecipes() {
  const { data, error } = await supabase.from('recipes').select(RECIPE_SELECT_COLUMNS);
  if (error) throw error;
  return data.map(normalizeRecipe);
}

export async function loadCookRecords(userId) {
  const { data, error } = await supabase
    .from('cooking_history')
    .select('id, user_id, recipe_id, cooked_date, created_at')
    .eq('user_id', userId)
    .order('cooked_date', { ascending: false })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addCookRecord(userId, cookedOn, recipeId) {
  const { data, error } = await supabase
    .from('cooking_history')
    .upsert(
      { user_id: userId, cooked_date: cookedOn, recipe_id: recipeId },
      { onConflict: 'user_id,cooked_date,recipe_id' },
    )
    .select('id, user_id, recipe_id, cooked_date, created_at')
    .single();
  if (error) throw error;
  return data;
}

export async function removeCookRecord(recordId) {
  const { error } = await supabase
    .from('cooking_history')
    .delete()
    .eq('id', recordId);
  if (error) throw error;
}
