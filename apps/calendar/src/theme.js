// 共用視覺樣式常數（配色、圓角、陰影）+ 事件顏色選項。
// 對應設計稿的「柔和藍」主題。實際色值在 theme.css 的 CSS 變數，這裡只是把變數名包成 JS 常數；所有元件的 inline style 都從這裡取值，不要各自硬編色碼。

export const THEME = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  surfaceAlt: 'var(--surface-alt)',
  surfaceAlt2: 'var(--surface-alt2)',
  primary: 'var(--primary)',
  primaryDark: 'var(--primary-strong)',
  primarySoft: 'var(--primary-soft)',
  textDark: 'var(--text)',
  textMuted: 'var(--text-muted)',
  textFaint: 'var(--text-faint)',
  border: 'var(--line)',
  radius: 20,
  radiusSm: 14,
  radiusSmInner: 11,
  success: 'var(--success)',
  successBg: 'var(--success-bg)',
  error: 'var(--danger)',
  errorBg: 'var(--danger-bg)',
  shadow: 'var(--shadow-card)',
  // ＃快速注記的深藍色（2026-07-10 從暖橘改藍，使用者反饋）
  hashtagInk: 'var(--primary-strong)',
  hashtagBg: 'var(--primary-soft)',
};

// 事件顏色選項（事件表單的顏色選擇器、月/週/日檢視的顏色圓點都用這組）
export const EVENT_COLORS = ['#3D5A80', '#3D8073', '#4F8052', '#8C7A3D', '#8C5A3D', '#6B3D80', '#803D5A'];

// 日記標籤依所屬分類上色（分類本身沒有存顏色，用分類在清單裡的順序固定分配）
const CATEGORY_ACCENTS = ['#3D5A80', '#6B7FA8', '#8B6F9E', '#4A8B8C', '#A0785A'];
export function categoryAccentForTag(tag, categories) {
  const idx = categories.findIndex((c) => c.tags.some((t) => t.name === tag || (t.subs || []).includes(tag)));
  if (idx === -1) return THEME.textMuted;
  return CATEGORY_ACCENTS[idx % CATEGORY_ACCENTS.length];
}
