// Recipe catalog view: search, category tabs, and grid cards.
import React from 'react';
import { ALL_CATEGORY } from '../utils.js';

const S = {
  viewHome: { padding: '6px 18px 20px' },
  title: { fontSize: 24, fontWeight: 900, color: '#3D281E', lineHeight: 1.2, margin: 0 },
  status: { fontSize: 13, color: '#E87A24', fontWeight: 700, marginTop: 4, margin: 0 },
  search: {
    width: '100%', border: 'none', background: '#FDF7F4', borderRadius: 14,
    padding: '12px 16px', fontSize: 15, fontWeight: 700, color: '#3D281E', marginTop: 12,
    outline: 'none', boxSizing: 'border-box',
  },
  tabsContainer: { display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 0' },
  tabInactive: {
    border: 'none', background: '#FDF7F4', color: '#8E7568', padding: '8px 16px',
    borderRadius: 20, fontSize: 13, fontWeight: 800, cursor: 'pointer',
    whiteSpace: 'nowrap', flexShrink: 0,
  },
  tabActive: {
    border: 'none', background: '#E87A24', color: '#fff', padding: '8px 16px',
    borderRadius: 20, fontSize: 13, fontWeight: 800, cursor: 'pointer',
    whiteSpace: 'nowrap', flexShrink: 0,
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 4 },
  card: {
    background: '#fff', borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
    boxShadow: '0 6px 18px -12px rgba(232,122,36,.25)',
  },
  cardImage: { width: '100%', height: 120, objectFit: 'cover', display: 'block' },
  placeholder: {
    width: '100%', height: 120, background: '#FDF7F4', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 36,
  },
  cardInfo: { padding: '10px 12px 12px' },
  badge: {
    fontSize: 11, background: '#FFF5EE', color: '#E87A24', padding: '3px 8px',
    borderRadius: 10, fontWeight: 800, marginRight: 4, display: 'inline-block',
  },
  cardTitle: { fontSize: 14, fontWeight: 900, color: '#3D281E', marginTop: 6, lineHeight: 1.3, margin: 0, marginBlockStart: 6 },
  empty: { textAlign: 'center', padding: '40px 20px', color: '#C5B4AC', fontSize: 15, fontWeight: 700 },
};

export default function RecipeCatalog({
  recipes,
  searchQuery,
  onSearchQueryChange,
  selectedCategory,
  onSelectedCategoryChange,
  availableCategories,
  filteredRecipes,
  onOpenDetail,
  onSignOut,
}) {
  return (
    <div style={S.viewHome}>
      <header style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={S.title}>TY Recipe Book</h1>
            <p style={S.status}>● 共有 {recipes.length} 道私房料理</p>
          </div>
          {onSignOut && (
            <button onClick={onSignOut} style={{ border: 'none', background: '#F0E7E1', color: '#8E7568', fontWeight: 800, fontSize: 13, padding: '8px 14px', borderRadius: 14, cursor: 'pointer' }}>登出</button>
          )}
        </div>

        <div>
          <input
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            type="text"
            placeholder="🔍 搜尋你想吃什麼料理..."
            style={S.search}
          />
        </div>
      </header>

      {/* 🌟 調整後的獨立分類頁籤區塊 */}
      <div>
        <div className="ps" style={S.tabsContainer}>
          <button
            type="button"
            style={selectedCategory === ALL_CATEGORY ? S.tabActive : S.tabInactive}
            onClick={() => onSelectedCategoryChange(ALL_CATEGORY)}
          >
            全部
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              style={selectedCategory === cat ? S.tabActive : S.tabInactive}
              onClick={() => onSelectedCategoryChange(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <main>
        {filteredRecipes.length > 0 ? (
          <div style={S.grid}>
            {filteredRecipes.map((recipe) => (
              <div key={recipe.id} style={S.card} onClick={() => onOpenDetail(recipe)}>
                <div>
                  {recipe.image_url
                    ? <img src={recipe.image_url} alt={recipe.title} style={S.cardImage} loading="lazy" />
                    : <div style={S.placeholder}>🍳</div>}
                </div>
                <div style={S.cardInfo}>
                  <div>
                    {recipe.category.map((tag) => (
                      <span key={tag} style={S.badge}>{tag}</span>
                    ))}
                  </div>
                  <h3 style={S.cardTitle}>{recipe.title}</h3>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={S.empty}>
            <p>這個分類下目前沒有對應的美食數據 🥲</p>
          </div>
        )}
      </main>
    </div>
  );
}
