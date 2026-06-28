import { computed, ref } from 'vue'
import { filterRecipes, getAvailableCategories } from '../utils/recipeData'

export const useRecipeFilters = (recipes) => {
  const searchQuery = ref('')
  const selectedCategory = ref('全部')

  const availableCategories = computed(() => getAvailableCategories(recipes.value))
  const filteredRecipes = computed(() => (
    filterRecipes(recipes.value, selectedCategory.value, searchQuery.value)
  ))

  return {
    searchQuery,
    selectedCategory,
    availableCategories,
    filteredRecipes
  }
}
