<template>
  <div class="mobile-cooking-app-container">
    
    <RecipeCatalog 
      v-if="currentView === 'home'"
      :recipes="recipes"
      v-model:searchQuery="searchQuery"
      v-model:selectedCategory="selectedCategory"
      :availableCategories="availableCategories"
      :filteredRecipes="filteredRecipes"
      @open-detail="openRecipeDetail"
    />

    <RecipeDetail 
      v-else-if="currentView === 'detail' && selectedRecipe"
      :recipe="selectedRecipe"
    />

  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import RecipeCatalog from './components/RecipeCatalog.vue'
import RecipeDetail from './components/RecipeDetail.vue'
import { useRecipeFilters } from './composables/useRecipeFilters'
import { useRecipeNavigation } from './composables/useRecipeNavigation'
import { useRecipes } from './composables/useRecipes'

const { recipes, fetchRecipes } = useRecipes()
const {
  searchQuery,
  selectedCategory,
  availableCategories,
  filteredRecipes
} = useRecipeFilters(recipes)
const {
  currentView,
  selectedRecipe,
  openRecipeDetail,
  syncViewWithUrl
} = useRecipeNavigation(recipes)

onMounted(async () => {
  await fetchRecipes()
  syncViewWithUrl()
})
</script>

<style>
body { margin: 0; background-color: #f6f8fa; }
.mobile-cooking-app-container { min-height: 100vh; background-color: #f6f8fa; color: #24292e; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
</style>
