<template>
  <div class="view-detail">
    <header class="mobile-header detail-header">
      <div class="hint-badge">⏱️ 長按標記進度</div>
    </header>

    <main class="mobile-main">
      <div class="cooking-card">
        <div v-if="recipe.image_url" class="recipe-image-wrapper">
          <img :src="recipe.image_url" :alt="recipe.title" class="recipe-image">
        </div>

        <div class="card-header">
          <div class="header-badges-row">
            <template v-if="Array.isArray(recipe.category)">
              <span 
                v-for="tag in recipe.category" 
                :key="tag" 
                class="category-badge"
              >
                {{ tag }}
              </span>
            </template>
            
            <template v-if="parsedYieldInfo.length > 0">
              <span 
                v-for="(yieldText, idx) in parsedYieldInfo" 
                :key="idx" 
                class="yield-spec-badge"
              >
                🍽️ {{ yieldText }}
              </span>
            </template>
          </div>
          
          <div class="title-with-logo-row">
            <img src="/chef_logo_bust.webp" alt="Peggy Chef Logo" class="inline-chef-logo">
            <h2 class="recipe-title">{{ recipe.title }}</h2>
          </div>
        </div>

        <div v-if="hasParameters" class="parameters-dashboard">
          <div class="dashboard-title">重點參數</div>
          <div class="dashboard-grid">
            <div 
              v-for="(value, key) in recipe.parameters" 
              :key="key" 
              class="dashboard-item"
            >
              <span class="param-key">{{ key }}</span>
              <span class="param-value">{{ value }}</span>
            </div>
          </div>
        </div>

        <div v-if="baseIng" class="scale-controller">
          <div class="scale-label">⚖️ 依據主食材等比例縮放配方：</div>
          <div class="scale-inputs">
            <span class="base-name">{{ baseIng.name }}</span>
            <input 
              type="number" 
              v-model.number="currentWeight"
              :placeholder="baseIng.amount"
              class="weight-input"
              pattern="[0-9]*"
            >
            <span class="unit-text">克 (g)</span>
            <button v-if="isScaled" @click="currentWeight = null" class="reset-scale-btn">重設</button>
          </div>
          <div v-if="isScaled" class="scale-alert">
            📢 比例已調整為原本的 <b>{{ scaleRatio.toFixed(2) }}</b> 倍
          </div>
        </div>

        <div 
          v-for="group in groupedIngredients" 
          :key="group.typeName" 
          class="card-section"
        >
          <div class="section-divider">
            <span v-if="group.typeName === 'DEFAULT'">📦 準備食材</span>
            <span v-else>📦 準備食材：{{ group.typeName }}</span>
          </div>

          <div class="mobile-ingredients-list">
            <div 
              v-for="ing in group.items" 
              :key="ing.name" 
              class="ingredient-item"
              :class="{ 'is-completed': completedItems[`ing-${recipe.id}-${ing.name}`] }"
              @touchstart="startLongPress(`ing-${recipe.id}-${ing.name}`)"
              @touchend="endLongPress"
              @mousedown="startLongPress(`ing-${recipe.id}-${ing.name}`)"
              @mouseup="endLongPress"
            >
              <div class="ing-name-block">
                <span class="ing-name">{{ ing.name }}</span>
                <span v-if="ing.brand" class="ing-brand-badge">{{ ing.brand }}</span>
              </div>
              <span class="ing-amount highlight-amount">
                {{ getScaledAmount(ing) }}
              </span>
            </div>
          </div>
        </div>

        <div 
          v-for="stepGroup in sortedGroupedSteps" 
          :key="stepGroup.typeName" 
          class="card-section"
        >
          <div class="section-divider">
            <span v-if="stepGroup.typeName === 'DEFAULT'">⏱️ 料理工序</span>
            <span v-else>⏱️ 料理工序：{{ stepGroup.typeName }}</span>
          </div>

          <ol class="cooking-steps">
            <li 
              v-for="(step, index) in stepGroup.items" 
              :key="index"
              :class="{ 'is-completed': completedItems[`step-${recipe.id}-${stepGroup.typeName}-${index}`] }"
              @touchstart="startLongPress(`step-${recipe.id}-${stepGroup.typeName}-${index}`)"
              @touchend="endLongPress"
              @mousedown="startLongPress(`step-${recipe.id}-${stepGroup.typeName}-${index}`)"
              @mouseup="endLongPress"
            >
              <div class="step-number">{{ index + 1 }}</div>
              <div class="step-text">{{ step.text }}</div>
            </li>
          </ol>
        </div>

        <div v-if="formattedNotes.length > 0" class="card-section note-section">
          <div class="section-divider"><span>💡 心得與備註</span></div>
          <ul class="cooking-notes-list">
            <li 
              v-for="(note, index) in formattedNotes" 
              :key="index"
              :class="{ 'is-completed': completedItems[`note-${recipe.id}-${index}`] }"
              @touchstart="startLongPress(`note-${recipe.id}-${index}`)"
              @touchend="endLongPress"
              @mousedown="startLongPress(`note-${recipe.id}-${index}`)"
              @mouseup="endLongPress"
            >
              <span class="notes-bullet">●</span>
              <p class="notes-text">{{ note }}</p>
            </li>
          </ul>
        </div>

        <div v-if="recipe.last_cooked_at" class="card-footer-history">
          <span class="history-time-text">🕒 上次製作：{{ formatDate(recipe.last_cooked_at) }}</span>
        </div>

      </div>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRecipeDetail } from '../composables/useRecipeDetail'

const props = defineProps({
  recipe: Object
})

const recipeRef = computed(() => props.recipe)
const {
  currentWeight,
  completedItems,
  hasParameters,
  parsedYieldInfo,
  groupedIngredients,
  sortedGroupedSteps,
  baseIng,
  scaleRatio,
  isScaled,
  getScaledAmount,
  formattedNotes,
  formatDate,
  startLongPress,
  endLongPress
} = useRecipeDetail(recipeRef)
</script>

<style scoped>
.detail-header { 
  display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  @media (min-width: 768px) { max-width: 800px; margin: 0 auto; }
  .hint-badge { font-size: 11px; color: #657280; background: #f1f5f9; padding: 4px 8px; border-radius: 4px; white-space: nowrap; }
}
.mobile-main { padding: 16px; @media (min-width: 768px) { max-width: 800px; margin: 0 auto; padding: 16px 0; } }
.cooking-card {
  background: #ffffff; border-radius: 12px; border: 1px solid #d0d7de; box-shadow: 0 3px 6px rgba(140, 149, 159, 0.1); padding: 20px; overflow: hidden; box-sizing: border-box;
  @media (min-width: 768px) { max-width: 800px; margin: 0 auto 20px auto; }
  .recipe-image-wrapper { margin: -20px -20px 16px -20px; height: 200px; overflow: hidden; background-color: #e1e4e8; border-bottom: 1px solid #d0d7de; @media (min-width: 768px) { height: 320px; } .recipe-image { width: 100%; height: 100%; object-fit: cover; object-position: center; } }
  
  .card-header { 
    margin-bottom: 16px; 
    .header-badges-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
    .category-badge { display: inline-block; background: #dafbe1; color: #1a7f37; font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 4px; white-space: nowrap; }; 
    .yield-spec-badge { display: inline-block; background: #f1f5f9; color: #475569; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; border: 1px solid #e2e8f0; white-space: nowrap; }
    
    /* 🌟 核心樣式升級：菜名與 Logo 的黃金排版線路 */
    .title-with-logo-row { display: flex; align-items: center; gap: 10px; margin-top: 4px; }
    .inline-chef-logo { width: 62px; height: 62px; object-fit: contain; flex-shrink: 0; }
    .recipe-title { margin: 0; font-size: 24px; font-weight: 800; color: #1f2937; line-height: 1.2; } 
  }

  /* 核心工藝參數控制面板 CSS */
  .parameters-dashboard {
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; margin-bottom: 16px;
    .dashboard-title { font-size: 12.5px; font-weight: 700; color: #475569; letter-spacing: 0.5px; margin-bottom: 10px; text-transform: uppercase; border-bottom: 1px dashed #cbd5e1; padding-bottom: 6px; }
    .dashboard-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .dashboard-item { display: flex; flex-direction: column; gap: 2px; background: #ffffff; padding: 8px 10px; border-radius: 6px; border: 1px solid #f1f5f9; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
    .param-key { font-size: 11px; font-weight: 600; color: #94a3b8; }
    .param-value { font-size: 14px; font-weight: 700; color: #1e293b; }
  }
  
  .scale-controller { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; margin-bottom: 16px; .scale-label { font-size: 12.5px; color: #1e40af; font-weight: 600; margin-bottom: 8px; } .scale-inputs { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; .base-name { font-size: 14px; font-weight: 700; color: #1e3a8a; } .weight-input { width: 90px; padding: 6px 10px; font-size: 15px; font-weight: 700; border: 1px solid #3b82f6; border-radius: 6px; text-align: center; color: #1e3a8a; background: #ffffff; } .unit-text { font-size: 14px; color: #1e40af; font-weight: 600; } .reset-scale-btn { background: #ffffff; color: #dc2626; border: 1px solid #fca5a5; padding: 5px 10px; font-size: 12px; font-weight: 600; border-radius: 6px; cursor: pointer; margin-left: auto; } } .scale-alert { margin-top: 8px; font-size: 12px; color: #2563eb; font-weight: 500; } }
  .card-section { margin-bottom: 24px; }
  .section-divider { display: flex; margin-bottom: 12px; span { font-size: 13px; font-weight: 700; color: #57606a; } }
  .mobile-ingredients-list { background: #f6f8fa; border-radius: 8px; padding: 4px 12px; margin-bottom: 4px;
    .ingredient-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; font-size: 16px; border-bottom: 1px solid #eee; &:last-child { border-bottom: none; } .ing-name-block { display: flex; align-items: center; gap: 8px; } .ing-name { font-weight: 600; color: #24292e; } .ing-brand-badge { background: #eaf5ff; color: #0366d6; font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px; border: 1px solid #b4d7ff; } .ing-amount { color: #0969da; font-weight: 700; font-family: monospace; } &.is-completed { opacity: 0.25; text-decoration: line-through; .ing-brand-badge { background: #cbd5e1; color: #64748b; border-color: #cbd5e1; } } }
  }
  .cooking-steps { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 14px; margin-bottom: 4px;
    li { display: flex; gap: 12px; align-items: start; .step-number { background: #24292e; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; margin-top: 2px; } .step-text { font-size: 16px; line-height: 1.6; color: #24292e; } &.is-completed { opacity: 0.25; .step-number { background: #cbd5e1; }; .step-text { text-decoration: line-through; } } }
  }
  .note-section { margin-top: 32px; .section-divider { margin-bottom: 12px; } }
  .cooking-notes-list { list-style: none; padding: 18px 20px; margin: 0; background: #fff8c5; border: 1px solid #cca700; border-radius: 8px; display: flex; flex-direction: column; gap: 12px; box-sizing: border-box; li { display: flex; gap: 10px; align-items: start; transition: all 0.2s; .notes-bullet { color: #735c00; font-size: 10px; margin-top: 5px; flex-shrink: 0; } .notes-text { margin: 0; font-size: 14.5px; color: #735c00; font-weight: 500; line-height: 1.6; } &.is-completed { opacity: 0.25; .notes-text { text-decoration: line-through; } } } }
  .card-footer-history { display: flex; justify-content: flex-end; margin-top: 28px; padding-top: 12px; border-top: 1px dashed #e1e4e8; .history-time-text { font-size: 12px; color: #8c959f; font-weight: 500; } }
}
</style>
