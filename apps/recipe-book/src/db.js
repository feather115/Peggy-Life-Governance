// Pure fetch functions for Supabase; components do not communicate with the database directly, but use the state/actions returned by useRecipes.
import { supabase } from './supabase.js';
import { normalizeRecipe } from './utils.js';

const RECIPE_SELECT_COLUMNS = [
  'id',
  'user_id',
  'is_shared',
  'title',
  'category',
  'ingredients',
  'steps',
  'notes',
  'image_url',
  'last_cooked_at',
  'yield_info',
  'parameters',
  'created_at',
  'updated_at',
].join(', ');

export async function loadRecipes() {
  // RLS handles filtering: anon sees only is_shared=true; logged-in sees own + shared.
  const { data, error } = await supabase.from('recipes').select(RECIPE_SELECT_COLUMNS);
  if (error) throw error;
  return data.map(normalizeRecipe);
}

export async function createRecipe(userId, payload) {
  const { data, error } = await supabase
    .from('recipes')
    .insert({ ...payload, user_id: userId })
    .select(RECIPE_SELECT_COLUMNS)
    .single();
  if (error) throw error;
  return normalizeRecipe(data);
}

export async function updateRecipe(recipeId, patch) {
  const { data, error } = await supabase
    .from('recipes')
    .update(patch)
    .eq('id', recipeId)
    .select(RECIPE_SELECT_COLUMNS)
    .single();
  if (error) throw error;
  return normalizeRecipe(data);
}

export async function deleteRecipe(recipeId) {
  const { error } = await supabase.from('recipes').delete().eq('id', recipeId);
  if (error) throw error;
}

// 一次抓全部 likes（含 user_id），由前端 group 出 counts + myLikedIds。
// 量小（每筆 < 50B），不會爆。要是之後資料大再改用 RPC 或 view。
export async function loadAllLikes() {
  const { data, error } = await supabase
    .from('recipe_likes')
    .select('recipe_id, user_id');
  if (error) throw error;
  return data || [];
}

export async function likeRecipe(userId, recipeId) {
  const { error } = await supabase
    .from('recipe_likes')
    .insert({ user_id: userId, recipe_id: recipeId });
  if (error && error.code !== '23505') throw error; // 23505 = unique violation, 重複按讚當作 no-op
}

export async function unlikeRecipe(userId, recipeId) {
  const { error } = await supabase
    .from('recipe_likes')
    .delete()
    .eq('user_id', userId)
    .eq('recipe_id', recipeId);
  if (error) throw error;
}

export async function loadCookRecords(userId) {
  const { data, error } = await supabase
    .from('cooking_history')
    .select('id, user_id, recipe_id, cooked_date, created_at, notes')
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
    .select('id, user_id, recipe_id, cooked_date, created_at, notes')
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

export async function updateCookRecordNotes(recordId, notes) {
  const { data, error } = await supabase
    .from('cooking_history')
    .update({ notes })
    .eq('id', recordId)
    .select('id, user_id, recipe_id, cooked_date, created_at, notes')
    .single();
  if (error) throw error;
  return data;
}
