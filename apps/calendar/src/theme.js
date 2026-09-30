// 共用視覺樣式常數（配色）+ 事件顏色選項。圓角、陰影與元件樣式改用 @peggy-life/shared/ui 的 UI（三個 app 共用）。
// 對應設計稿的「柔和藍」主題。實際色值在 theme.css 的 CSS 變數，這裡只是把變數名包成 JS 常數；所有元件的 inline style 都從這裡取值，不要各自硬編色碼。

export const THEME = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  surfaceAlt: 'var(--surface-alt)',
  primary: 'var(--primary)',
  // 當「字色」用的主色：淺色模式跟 primary 一樣；深色模式比較亮，深底上才讀得到（primary 本身留給實心按鈕底色）
  primaryInk: 'var(--primary-ink)',
  primaryDark: 'var(--primary-strong)',
  primarySoft: 'var(--primary-soft)',
  textDark: 'var(--text)',
  textMuted: 'var(--text-muted)',
  textFaint: 'var(--text-faint)',
  border: 'var(--line)',
  success: 'var(--success)',
  successInk: 'var(--success-ink)',
  errorInk: 'var(--danger-ink)',
  // ＃快速注記的深藍色（2026-07-10 從暖橘改藍，使用者反饋）
  hashtagInk: 'var(--primary-strong)',
  hashtagBg: 'var(--primary-soft)',
};

// 事件顏色選項（紀錄表單的 7 個預設色、月檢視的顏色圓點都用這組）。
// 清新色系：天空藍、湖水綠、嫩芽綠、蜂蜜黃、蜜桃橘、薰衣草、櫻花粉。7 色亮度一致（L*≈61），
// 在白底上對比都 ≥3:1（月曆 6px 小圓點才看得清楚），任兩色色差 ΔE≥26 不會混淆。
// 2026-09-30 從原本偏暗的大地色換掉；舊紀錄的顏色依位置對應換成新色見 supabase/2026-09-30_refresh_event_colors.sql。
// 要改色請維持大寫 #RRGGBB（表單用字串比對判斷選中哪一個）。
export const EVENT_COLORS = ['#5497E3', '#27A594', '#4EA651', '#C68910', '#ED6C45', '#9787E8', '#E56C9C'];

// 日記標籤依所屬分類上色（分類本身沒有存顏色，用分類在清單裡的順序固定分配）
// 12px 小字放在淡藍底（primarySoft）上，每色都要 ≥4.5:1；實際色值在 theme.css 的 --cat-1～5（深色模式有另一組比較亮的）
const CATEGORY_ACCENTS = ['var(--cat-1)', 'var(--cat-2)', 'var(--cat-3)', 'var(--cat-4)', 'var(--cat-5)'];
export function categoryAccentForTag(tag, categories) {
  const idx = categories.findIndex((c) => c.tags.some((t) => t.name === tag || (t.subs || []).includes(tag)));
  if (idx === -1) return THEME.textMuted;
  return CATEGORY_ACCENTS[idx % CATEGORY_ACCENTS.length];
}
