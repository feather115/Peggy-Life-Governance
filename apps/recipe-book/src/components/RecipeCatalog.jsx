// 食譜清單畫面：搜尋、分類分頁、網格卡片。
import React from 'react';
import { ALL_CATEGORY } from '../utils.js';
import './RecipeCatalog.css';

export default function RecipeCatalog({
  recipes,
  searchQuery,
  onSearchQueryChange,
  selectedCategory,
  onSelectedCategoryChange,
  availableCategories,
  filteredRecipes,
  onOpenDetail,
}) {
  return (
    <div className="view-home">
      <header className="mobile-mega-header">
        <div className="mega-brand-container">
          <div className="logo-left-wing">
            <img src="/chef_logo_full.webp" alt="Peggy Full Logo" className="chef-logo-img-large" />
          </div>

          <div className="control-right-wing">
            <div className="title-status-block">
              <h1>TY的私人食譜</h1>
              <p className="status-online">● 共有 {recipes.length} 道私房料理</p>
            </div>

            <div className="mobile-search-section">
              <input
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                type="text"
                placeholder="🔍 搜尋你想吃什麼料理..."
                className="search-input"
              />
            </div>
          </div>
        </div>
      </header>

      {/* 🌟 調整後的獨立分類頁籤區塊 */}
      <div className="category-tabs-container">
        <div className="category-tabs">
          <button
            type="button"
            className={'tab-btn' + (selectedCategory === ALL_CATEGORY ? ' is-active' : '')}
            onClick={() => onSelectedCategoryChange(ALL_CATEGORY)}
          >
            全部
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={'tab-btn' + (selectedCategory === cat ? ' is-active' : '')}
              onClick={() => onSelectedCategoryChange(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <main className="mobile-main">
        {filteredRecipes.length > 0 ? (
          <div className="recipe-grid">
            {filteredRecipes.map((recipe) => (
              <div key={recipe.id} className="grid-card" onClick={() => onOpenDetail(recipe)}>
                <div className="grid-image-wrapper">
                  {recipe.image_url
                    ? <img src={recipe.image_url} alt={recipe.title} className="grid-image" loading="lazy" />
                    : <div className="grid-image-placeholder">🍳</div>}
                </div>
                <div className="grid-card-info">
                  <div className="grid-tags-row">
                    {recipe.category.map((tag) => (
                      <span key={tag} className="grid-category-badge">{tag}</span>
                    ))}
                  </div>
                  <h3 className="grid-recipe-title">{recipe.title}</h3>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mobile-empty">
            <p>這個分類下目前沒有對應的美食數據 🥲</p>
          </div>
        )}
      </main>
    </div>
  );
}
