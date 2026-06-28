import { supabase } from '../lib/supabaseClient'
import { normalizeRecipe } from '../utils/recipeData'

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
  'parameters'
].join(', ')

export const getRecipes = async () => {
  const { data, error } = await supabase
    .from('recipes')
    .select(RECIPE_SELECT_COLUMNS)

  if (error) throw error

  return data.map(normalizeRecipe)
}
