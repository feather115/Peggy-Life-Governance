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
      @back="goBackToHome"
    />

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { createClient } from '@supabase/supabase-js'
import RecipeCatalog from './components/RecipeCatalog.vue'
import RecipeDetail from './components/RecipeDetail.vue'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const recipes = ref([])
const searchQuery = ref('')
const selectedCategory = ref('全部')
const currentView = ref('home')
const selectedRecipe = ref(null)

const availableCategories = computed(() => {
  const categories = recipes.value.map(r => r.category).filter(Boolean)
  return [...new Set(categories)]
})

const openRecipeDetail = (recipe) => {
  selectedRecipe.value = recipe
  currentView.value = 'detail'
  window.scrollTo({ top: 0, behavior: 'instant' })
}

const goBackToHome = () => {
  currentView.value = 'home'
  selectedRecipe.value = null
}

const fetchData = async () => {
  try {
    const { data, error } = await supabase
      .from('recipes')
      /* 🌟 核心修正：撈取欄位正式加入 yield_info */
      .select('id, title, category, ingredients, steps, notes, image_url, last_cooked_at, yield_info')
    if (error) throw error
    
    // 🛡️ 空值安全防線：萬一有舊食譜欄位是 NULL，自動在前端補上空陣列，確保系統絕不崩潰
    recipes.value = data.map(r => ({
      ...r,
      yield_info: r.yield_info || []
    }))
  } catch (error) {
    console.error("雲端數據調度失敗：", error.message)
  }
}

onMounted(() => fetchData())

const filteredRecipes = computed(() => {
  return recipes.value.filter(recipe => {
    const matchCategory = selectedCategory.value === '全部' || recipe.category === selectedCategory.value
    const query = searchQuery.value.trim().toLowerCase()
    const matchSearch = !query || recipe.title.toLowerCase().includes(query) || recipe.category.toLowerCase().includes(query)
    return matchCategory && matchSearch
  })
})
</script>

<style>
body { margin: 0; background-color: #f6f8fa; }
.mobile-cooking-app-container { min-height: 100vh; background-color: #f6f8fa; color: #24292e; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
</style>