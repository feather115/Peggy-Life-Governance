<template>
  <div class="view-home">
    
    <header class="mobile-mega-header">
      <div class="mega-brand-container">
        
        <div class="logo-left-wing">
          <img src="/chef_logo_full.webp" alt="Peggy Full Logo" class="chef-logo-img-large">
        </div>
        
        <div class="control-right-wing">
          <div class="title-status-block">
            <h1>TY的私人食譜</h1>
            <p class="status-online">● 共有 {{ recipes.length }} 道私房料理</p>
          </div>
          
          <div class="mobile-search-section">
            <input 
              :value="searchQuery"
              @input="$emit('update:searchQuery', $event.target.value)"
              type="text" 
              placeholder="🔍 搜尋你想吃什麼料理..." 
              class="search-input"
            >
          </div>
        </div>

      </div>
    </header>

    <!-- 🌟 調整後的獨立分類頁籤區塊 -->
    <div class="category-tabs-container">
      <div class="category-tabs">
        <button 
          class="tab-btn" 
          :class="{ 'is-active': selectedCategory === '全部' }"
          @click="$emit('update:selectedCategory', '全部')"
        >
          全部
        </button>
        <button 
          v-for="cat in availableCategories" 
          :key="cat"
          class="tab-btn" 
          :class="{ 'is-active': selectedCategory === cat }"
          @click="$emit('update:selectedCategory', cat)"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <main class="mobile-main">
      <div v-if="filteredRecipes.length > 0" class="recipe-grid">
        <div 
          v-for="recipe in filteredRecipes" 
          :key="recipe.id" 
          class="grid-card"
          @click="$emit('open-detail', recipe)"
        >
          <div class="grid-image-wrapper">
            <img v-if="recipe.image_url" :src="recipe.image_url" :alt="recipe.title" class="grid-image" loading="lazy">
            <div v-else class="grid-image-placeholder">🍳</div>
          </div>
          <div class="grid-card-info">
            <div class="grid-tags-row">
              <span 
                v-for="tag in recipe.category" 
                :key="tag" 
                class="grid-category-badge"
              >
                {{ tag }}
              </span>
            </div>
            <h3 class="grid-recipe-title">{{ recipe.title }}</h3>
          </div>
        </div>
      </div>
      <div v-else class="mobile-empty">
        <p>這個分類下目前沒有對應的美食數據 🥲</p>
      </div>
    </main>
  </div>
</template>

<script setup>
defineProps({
  recipes: Array,
  searchQuery: String,
  selectedCategory: String,
  availableCategories: Array,
  filteredRecipes: Array
})
defineEmits(['update:searchQuery', 'update:selectedCategory', 'open-detail'])
</script>

<style scoped>
/* 🌟 大氣複合式中台看板 CSS */
.mobile-mega-header {
  background: #ffffff;
  padding: 24px 20px 16px 20px; /* 稍微調整底部內襯 */
  box-sizing: border-box;
  @media (min-width: 768px) { max-width: 800px; margin: 0 auto; border-left: 1px solid #e1e4e8; border-right: 1px solid #e1e4e8; border-bottom: 1px solid #e1e4e8; border-radius: 0 0 12px 12px; }

  .mega-brand-container {
    display: flex;
    align-items: flex-start;
    gap: 18px;
    
    .logo-left-wing {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .chef-logo-img-large { 
        width: 100px; 
        height: 100px; 
        object-fit: contain; 
      }
    }

    .control-right-wing {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
      
      .title-status-block {
        h1 { margin: 0; font-size: 22px; font-weight: 800; color: #111827; letter-spacing: -0.5px; line-height: 1.2; }
        .status-online { margin: 4px 0 0 0; font-size: 12px; color: #16a34a; font-weight: 600; }
      }

      .mobile-search-section {
        padding: 0;
        .search-input { 
          width: 100%; 
          padding: 10px 14px; 
          font-size: 15px; 
          border: 1px solid #d0d7de; 
          border-radius: 8px; 
          background: #f6f8fa; 
          box-sizing: border-box; 
          transition: all 0.15s ease;
          &:focus { outline: none; background: #ffffff; border-color: #2da44e; box-shadow: 0 0 0 3px rgba(45, 164, 78, 0.15); }
        }
      }
    }
  }
}

/* 🌟 分類頁籤專屬大底槽 - 已修改為獨立、不黏貼的漂浮卡片樣式 */
.category-tabs-container {
  background: #ffffff; 
  padding: 14px 16px;          /* 讓上下內襯更平均平衡 */
  margin: 16px 16px 0 16px;    /* 核心修改：利用 margin-top 直接把分類跟上面 header 頂開，左右留白 */
  border: 1px solid #e1e4e8;   /* 讓它在手機端成為獨立卡片 */
  border-radius: 12px;         /* 手機端四邊圓角 */
  box-shadow: 0 4px 12px rgba(140, 149, 159, 0.02);

  @media (min-width: 768px) { 
    max-width: 800px; 
    margin: 16px auto 0 auto;  /* 電腦端置中，並與上方保持 16px 距離 */
    padding: 14px 16px;
    box-shadow: 0 4px 12px rgba(140, 149, 159, 0.03); 
    box-sizing: border-box; 
  }

  .category-tabs {
    display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; -webkit-overflow-scrolling: touch;
    &::-webkit-scrollbar { display: none; }
    .tab-btn {
      background: #f6f8fa; color: #57606a; border: 1px solid #d0d7de; padding: 6px 14px; font-size: 14px; font-weight: 600; border-radius: 20px; white-space: nowrap; cursor: pointer; transition: all 0.15s ease;
      &:hover { background: #eaeef2; color: #24292e; }
      &.is-active { background: #2da44e; color: #ffffff; border-color: #2da44e; box-shadow: 0 2px 4px rgba(45, 164, 78, 0.2); }
    }
  }
}

/* 主要內容網格區 */
.mobile-main { padding: 16px; @media (min-width: 768px) { max-width: 800px; margin: 0 auto; padding: 16px 0; } }
.recipe-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; box-sizing: border-box;
  @media (min-width: 768px) { grid-template-columns: repeat(3, 1fr); max-width: 800px; margin: 0 auto; }
  .grid-card {
    background: #ffffff; border-radius: 10px; border: 1px solid #d0d7de; overflow: hidden; box-shadow: 0 2px 4px rgba(140, 149, 159, 0.05); display: flex; flex-direction: column; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;
    &:hover { transform: translateY(-4px); box-shadow: 0 6px 12px rgba(140, 149, 159, 0.15); }
    .grid-image-wrapper { width: 100%; height: 120px; background: #e1e4e8; overflow: hidden; position: relative; @media (min-width: 768px) { height: 140px; } .grid-image { width: 100%; height: 100%; object-fit: cover; } .grid-image-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 32px; } }
    .grid-card-info { padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; flex-grow: 1; 
      .grid-tags-row { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 2px; }
      .grid-category-badge { align-self: flex-start; background: #f1f5f9; color: #475569; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; white-space: nowrap; } 
      .grid-recipe-title { margin: 2px 0 0 0; font-size: 15px; font-weight: 800; color: #1f2937; line-height: 1.3; } 
    }
  }
}
.mobile-empty { text-align: center; padding: 40px 20px; color: #57606a; font-size: 15px; }
</style>