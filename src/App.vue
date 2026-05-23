<template>
  <div class="mobile-cooking-app">
    <header class="mobile-header">
      <div class="brand">
        <span class="chef-avatar">👩‍🍳</span>
        <div>
          <h1>PLG 私房食譜</h1>
          <p v-if="!errorMsg" class="status-online">● 通用架構穩定運行中</p>
        </div>
      </div>
      <div class="hint-badge">⏱️ 長按標記進度</div>
    </header>

    <div class="mobile-search-section">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="🔍 快速搜尋食譜..." 
        class="search-input"
      >
    </div>

    <main class="mobile-main">
      <div v-if="filteredRecipes.length > 0" class="card-stream">
        <div v-for="recipe in filteredRecipes" :key="recipe.id" class="cooking-card">
          
          <div class="card-header">
            <span class="category-badge">{{ recipe.category }}</span>
            <h2 class="recipe-title">{{ recipe.title }}</h2>
          </div>

          <div v-if="getBaseIngredient(recipe.ingredients)" class="scale-controller">
            <div class="scale-label">⚖️ 依據主食材等比例縮放配方：</div>
            <div class="scale-inputs">
              <span class="base-name">{{ getBaseIngredient(recipe.ingredients).name }}</span>
              <input 
                type="number" 
                v-model.number="recipeBaseWeights[recipe.id]"
                :placeholder="getBaseIngredient(recipe.ingredients).amount"
                class="weight-input"
                pattern="[0-9]*"
              >
              <span class="unit-text">克 (g)</span>
              <button v-if="isScaled(recipe)" @click="resetScale(recipe)" class="reset-scale-btn">重設</button>
            </div>
            <div v-if="isScaled(recipe)" class="scale-alert">
              📢 比例已調整為原本的 <b>{{ getScaleRatio(recipe).toFixed(2) }}</b> 倍
            </div>
          </div>

          <div class="card-section">
            <div class="section-divider"><span>📦 準備食材</span></div>
            <div class="mobile-ingredients-list">
              <div 
                v-for="ing in parseIngredients(recipe.ingredients)" 
                :key="ing.name" 
                class="ingredient-item"
                :class="{ 'is-completed': completedItems[`ing-${recipe.id}-${ing.name}`] }"
                @touchstart="startLongPress(`ing-${recipe.id}-${ing.name}`)"
                @touchend="endLongPress"
                @mousedown="startLongPress(`ing-${recipe.id}-${ing.name}`)"
                @mouseup="endLongPress"
              >
                <span class="ing-name">{{ ing.name }}</span>
                <span class="ing-amount highlight-amount">
                  {{ calculateScaledAmount(recipe, ing) }}
                </span>
              </div>
            </div>
          </div>

          <div class="card-section" v-if="recipe.steps">
            <div class="section-divider"><span>⏱️ 料理工序</span></div>
            <ol class="cooking-steps">
              <li 
                v-for="(step, index) in formatSteps(recipe.steps)" 
                :key="index"
                :class="{ 'is-completed': completedItems[`step-${recipe.id}-${index}`] }"
                @touchstart="startLongPress(`step-${recipe.id}-${index}`)"
                @touchend="endLongPress"
                @mousedown="startLongPress(`step-${recipe.id}-${index}`)"
                @mouseup="endLongPress"
              >
                <div class="step-number">{{ index + 1 }}</div>
                <div class="step-text">{{ step }}</div>
              </li>
            </ol>
          </div>

          <div v-if="recipe.notes" class="cooking-notes">
            <span class="notes-emoji">💡</span>
            <p>{{ recipe.notes }}</p>
          </div>

        </div>
      </div>

      <div v-else class="mobile-empty">
        <p>找不到對應的食譜數據 🥲</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const recipes = ref([])
const searchQuery = ref('')
const errorMsg = ref(null)
const completedItems = ref({})
let pressTimer = null
const recipeBaseWeights = reactive({})

// 標準化解析 Supabase 食材格式（相容舊物件與新陣列）
const parseIngredients = (ingredients) => {
  if (!ingredients) return []
  if (Array.isArray(ingredients)) return ingredients
  return Object.entries(ingredients).map(([name, amount], index) => ({
    name,
    amount,
    is_base: index === 0
  }))
}

// 動態抓取主食材
const getBaseIngredient = (ingredients) => {
  const list = parseIngredients(ingredients)
  return list.find(ing => ing.is_base) || list[0]
}

// 計算縮放倍率
const getScaleRatio = (recipe) => {
  const currentInput = recipeBaseWeights[recipe.id]
  if (!currentInput || isNaN(currentInput) || currentInput <= 0) return 1
  
  const baseIng = getBaseIngredient(recipe.ingredients)
  if (!baseIng) return 1
  
  const originalNumber = parseFloat(baseIng.amount)
  if (!originalNumber) return 1
  return currentInput / originalNumber
}

const isScaled = (recipe) => {
  return recipeBaseWeights[recipe.id] && recipeBaseWeights[recipe.id] > 0
}

const resetScale = (recipe) => {
  recipeBaseWeights[recipe.id] = null
}

// 計算縮放後的食材量
const calculateScaledAmount = (recipe, ing) => {
  const baseIng = getBaseIngredient(recipe.ingredients)
  const isBase = baseIng && ing.name === baseIng.name
  
  if (isBase && recipeBaseWeights[recipe.id]) {
    return `${recipeBaseWeights[recipe.id]} g`
  }

  const ratio = getScaleRatio(recipe)
  if (ratio === 1) return ing.amount

  const originalNumber = parseFloat(ing.amount)
  if (isNaN(originalNumber)) return ing.amount

  const scaledValue = (originalNumber * ratio).toFixed(1)
  const unit = ing.amount.includes('ml') ? 'ml' : 'g'
  return `${scaledValue} ${unit}`
}

// 長按邏輯
const startLongPress = (id) => {
  if (pressTimer) clearTimeout(pressTimer)
  pressTimer = setTimeout(() => {
    completedItems.value[id] = !completedItems.value[id]
  }, 700)
}

const endLongPress = () => {
  if (pressTimer) clearTimeout(pressTimer)
}

const fetchData = async () => {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('id, title, category, ingredients, steps, notes')
    if (error) throw error
    recipes.value = data
  } catch (error) {
    errorMsg.value = error.message
  }
}

onMounted(() => fetchData())

const filteredRecipes = computed(() => {
  if (!searchQuery.value.trim()) return recipes.value
  return recipes.value.filter(recipe => {
    return recipe.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
           recipe.category.toLowerCase().includes(searchQuery.value.toLowerCase())
  })
})

const formatSteps = (steps) => {
  if (Array.isArray(steps)) return steps
  if (typeof steps === 'string') {
    return steps.split('\n').filter(s => s.trim() !== '')
  }
  return []
}
</script>

<style scoped>
.mobile-cooking-app {
  min-height: 100vh; background-color: #f6f8fa; color: #24292e; font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding-bottom: 60px; -webkit-user-select: none; user-select: none;
  .mobile-header {
    background: #ffffff; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e1e4e8;
    .brand { display: flex; align-items: center; gap: 12px; h1 { margin: 0; font-size: 18px; font-weight: 700; }; .status-online { margin: 2px 0 0 0; font-size: 11px; color: #1a7f37; font-weight: 600; } }
    .hint-badge { font-size: 11px; color: #657280; background: #f1f5f9; padding: 4px 8px; border-radius: 4px; }
  }
  .mobile-search-section { padding: 12px 16px; background: #ffffff; .search-input { width: 100%; padding: 12px 16px; font-size: 16px; border: 1px solid #d0d7de; border-radius: 8px; background: #f6f8fa; box-sizing: border-box; } }
  .mobile-main { padding: 16px; }
  .card-stream { display: flex; flex-direction: column; gap: 20px; }
  .cooking-card {
    background: #ffffff; border-radius: 12px; border: 1px solid #d0d7de; box-shadow: 0 3px 6px rgba(140, 149, 159, 0.1); padding: 20px;
    .card-header { margin-bottom: 14px; .category-badge { display: inline-block; background: #dafbe1; color: #1a7f37; font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 4px; }; .recipe-title { margin: 4px 0 0 0; font-size: 24px; font-weight: 800; } }
    .scale-controller {
      background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; margin-bottom: 16px;
      .scale-label { font-size: 12.5px; color: #1e40af; font-weight: 600; margin-bottom: 8px; }
      .scale-inputs {
        display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        .base-name { font-size: 14px; font-weight: 700; color: #1e3a8a; }
        .weight-input { width: 90px; padding: 6px 10px; font-size: 15px; font-weight: 700; border: 1px solid #3b82f6; border-radius: 6px; text-align: center; color: #1e3a8a; background: #ffffff; }
        .unit-text { font-size: 14px; color: #1e40af; font-weight: 600; }
        .reset-scale-btn { background: #ffffff; color: #dc2626; border: 1px solid #fca5a5; padding: 5px 10px; font-size: 12px; font-weight: 600; border-radius: 6px; cursor: pointer; margin-left: auto; }
      }
      .scale-alert { margin-top: 8px; font-size: 12px; color: #2563eb; font-weight: 500; }
    }
    .section-divider { display: flex; margin-bottom: 12px; span { font-size: 13px; font-weight: 700; color: #57606a; } }
    .mobile-ingredients-list {
      background: #f6f8fa; border-radius: 8px; padding: 4px 12px;
      .ingredient-item {
        display: flex; justify-content: space-between; align-items: center; padding: 14px 0; font-size: 16px; border-bottom: 1px solid #eee; transition: all 0.2s;
        &:last-child { border-bottom: none; }
        .ing-name { font-weight: 600; color: #24292e; }
        .ing-amount { color: #0969da; font-weight: 700; font-family: monospace; }
        &.is-completed { opacity: 0.25; text-decoration: line-through; }
      }
    }
    .cooking-steps {
      list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 14px;
      li {
        display: flex; gap: 12px; align-items: start;
        .step-number { background: #24292e; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; margin-top: 2px; }
        .step-text { font-size: 16px; line-height: 1.6; color: #24292e; }
        &.is-completed { opacity: 0.25; .step-number { background: #cbd5e1; }; .step-text { text-decoration: line-through; } }
      }
    }
    .cooking-notes { margin-top: 20px; background: #fff8c5; border: 1px solid #cca700; border-radius: 8px; padding: 12px 16px; display: flex; gap: 10px; p { margin: 0; font-size: 14px; color: #735c00; font-weight: 500; } }
  }
}
</style>