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
