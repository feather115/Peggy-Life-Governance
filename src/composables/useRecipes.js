import { ref } from 'vue'
import { getRecipes } from '../services/recipeService'

export const useRecipes = () => {
  const recipes = ref([])
  const fetchError = ref('')

  const fetchRecipes = async () => {
    try {
      fetchError.value = ''
      recipes.value = await getRecipes()
    } catch (error) {
      fetchError.value = error.message
      console.error('雲端數據調度失敗：', error.message)
    }
  }

  return {
    recipes,
    fetchError,
    fetchRecipes
  }
}
