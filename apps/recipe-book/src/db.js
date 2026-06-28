// Supabase 的純查詢函式，元件不直接打資料庫，一律透過 useRecipes 拿到的 state/actions。
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
