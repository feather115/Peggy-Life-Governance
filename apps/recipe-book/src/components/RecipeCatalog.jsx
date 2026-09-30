// Recipe catalog view: 頁首、擁有者篩選（複選）、搜尋、分類膠囊（單選）、兩欄食譜卡片、右下浮動「新增食譜」。
// 沒有照片的食譜用菜名第一個字當佔位（不再用 emoji）
import React from 'react';
import { ALL_CATEGORY } from '../utils.js';
import Icon from '@peggy-life/shared/Icon.jsx';
import { UI } from '@peggy-life/shared/ui';

const S = {
  page: { paddingBottom: 100 },
  ownerRow: { ...UI.chipRow, padding: '8px 20px 0' },
  searchWrap: { position: 'relative', margin: '12px 20px 0' },
  searchIcon: { position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' },
  search: { ...UI.input, paddingLeft: 40 },
  categories: { display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 20px 0' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, padding: '16px 20px 0' },
  card: { ...UI.card, display: 'flex', flexDirection: 'column', overflow: 'hidden', color: 'inherit', textDecoration: 'none' },
  cardImage: { width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', display: 'block' },
  monogram: { width: '100%', aspectRatio: '4 / 3', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-soft)', color: 'var(--primary-ink)', fontSize: 36, fontWeight: 500 },
  cardInfo: { padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 },
  cardTitle: { margin: 0, fontSize: 15, fontWeight: 500, lineHeight: 1.35, color: 'var(--text)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
  cardMeta: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)', minWidth: 0 },
  empty: { ...UI.card, margin: '16px 20px 0', padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' },
  emptyIcon: { width: 48, height: 48, borderRadius: 999, background: 'var(--sunken)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
};

const OWNER_TABS = [
  { key: 'mine_shared', label: '我已分享' },
  { key: 'mine_private', label: '我的私房' },
  { key: 'others_shared', label: '大家分享' },
];

export default function RecipeCatalog({
  userId,
  isGuest,
  recipes,
  searchQuery,
  onSearchQueryChange,
  selectedCategory,
  onSelectedCategoryChange,
  availableCategories,
  filteredRecipes,
  onOpenDetail,
  onSignOut,
  signOutLabel = '登出',
  onCreate,
  ownershipFilter,
  onToggleOwnership,
  likeCounts,
  myLikedSet,
}) {
  const subtitle = isGuest
    ? `訪客模式 · 共 ${recipes.length} 道分享食譜`
    : `共 ${recipes.length} 道 · 這個分頁 ${filteredRecipes.length} 道`;
  return (
    <div style={S.page}>
      <header style={UI.header}>
        <div style={{ minWidth: 0 }}>
          <h1 style={UI.title}>食譜</h1>
          <p style={UI.subtitle}>{subtitle}</p>
        </div>
        {/* 登出在「設定」分頁；訪客沒有設定分頁，所以登入鈕留在這裡 */}
        {isGuest && onSignOut && (
          <button type="button" onClick={onSignOut} style={UI.btnSecondary}><Icon name="log-in" size={16} />{signOutLabel}</button>
        )}
      </header>

      {!isGuest && (
        <div style={S.ownerRow}>
          {OWNER_TABS.map((t) => {
            const on = ownershipFilter?.has(t.key);
            return (
              <button key={t.key} type="button" onClick={() => onToggleOwnership(t.key)} aria-pressed={on} style={{ ...UI.chip(on), ...(on ? { paddingLeft: 10 } : {}) }}>
                {on && <Icon name="check" size={16} strokeWidth={2} />}
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      <div style={S.searchWrap}>
        <Icon name="search" size={18} style={S.searchIcon} />
        <input aria-label="搜尋食譜" value={searchQuery} onChange={(e) => onSearchQueryChange(e.target.value)} type="search" placeholder="搜尋料理名稱" style={S.search} />
      </div>

      <div className="ps" style={S.categories}>
        {[ALL_CATEGORY, ...availableCategories].map((cat) => (
          <button key={cat} type="button" aria-pressed={selectedCategory === cat} onClick={() => onSelectedCategoryChange(cat)} style={UI.chip(selectedCategory === cat)}>
            {cat}
          </button>
        ))}
      </div>

      <main>
        {filteredRecipes.length > 0 ? (
          <div style={S.grid}>
            {filteredRecipes.map((recipe) => {
              const count = likeCounts?.get(recipe.id) || 0;
              const liked = myLikedSet?.has(recipe.id);
              return (
                <a key={recipe.id} href={`?recipe=${recipe.id}`} style={S.card} onClick={(e) => { e.preventDefault(); onOpenDetail(recipe); }}>
                  {recipe.image_url
                    ? <img src={recipe.image_url} alt="" style={S.cardImage} loading="lazy" />
                    : <div aria-hidden="true" style={S.monogram}>{recipe.title?.trim().slice(0, 1)}</div>}
                  <div style={S.cardInfo}>
                    <h3 style={S.cardTitle}>{recipe.title}</h3>
                    {/* 卡片只放圖片、名稱與按讚數（2026-06-28 起刻意不放分類，保持簡潔） */}
                    {count > 0 && (
                      <div style={S.cardMeta}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0, color: liked ? 'var(--like)' : 'var(--text-muted)' }} aria-label={`${count} 人按讚${liked ? '，包含你' : ''}`}>
                          <Icon name="heart" size={13} filled={liked} />{count}
                        </span>
                      </div>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <div style={S.empty}>
            <span aria-hidden="true" style={S.emptyIcon}><Icon name="utensils" size={22} /></span>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>這個分頁目前沒有食譜</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>換個分類或篩選條件看看{onCreate ? '，或新增一道' : ''}</div>
          </div>
        )}
      </main>

      {onCreate && (
        <button type="button" aria-label="新增食譜" onClick={onCreate} style={UI.fab}>
          <Icon name="plus" size={24} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
