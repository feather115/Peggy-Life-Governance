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

// 標準文字陣列的攤平去重大腦
const availableCategories = computed(() => {
  const allTags = recipes.value.flatMap(r => Array.isArray(r.category) ? r.category : [])
  const cleanTags = allTags.map(tag => tag ? tag.trim() : '').filter(Boolean)
  return [...new Set(cleanTags)]
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
      /* 🌟 核心升級：精準提取包含 yield_info 與 parameters 在內的全能治理維度 */
      .select('id, title, category, ingredients, steps, notes, image_url, last_cooked_at, yield_info, parameters')
    if (error) throw error
    
    recipes.value = data.map(r => ({
      ...r,
      category: Array.isArray(r.category) ? r.category : [],
      yield_info: r.yield_info || [],
      parameters: r.parameters || {} // 🛡️ 空值安全盾牌：沒寫參數的食譜預設給予物件袋子，防止崩潰
    }))
  } catch (error) {
    console.error("雲端數據調度失敗：", error.message)
  }
}

onMounted(() => fetchData())

// 多標籤交叉篩選與搜尋
const filteredRecipes = computed(() => {
  return recipes.value.filter(recipe => {
    const matchCategory = selectedCategory.value === '全部' || 
      recipe.category.includes(selectedCategory.value)
    
    const query = searchQuery.value.trim().toLowerCase()
    
    const matchSearch = !query || 
      recipe.title.toLowerCase().includes(query) || 
      recipe.category.some(tag => tag.toLowerCase().includes(query))
      
    return matchCategory && matchSearch
  })
})
</script>

<style>
body { margin: 0; background-color: #f6f8fa; }
.mobile-cooking-app-container { min-height: 100vh; background-color: #f6f8fa; color: #24292e; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
</style>