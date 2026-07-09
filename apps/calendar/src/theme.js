// 共用視覺樣式常數（配色、圓角、陰影）+ 事件顏色選項。
// 對應設計稿的「柔和藍」主題。所有元件的 inline style 都從這裡取值，不要各自硬編色碼。

export const THEME = {
  bg: '#EEF2F7',
  surface: '#FFFFFF',
  surfaceAlt: '#F4F7FB',
  surfaceAlt2: '#F7F9FC',
  primary: '#3D5A80',
  primaryDark: '#2C4562',
  primarySoft: '#E3EAF4',
  textDark: '#1F2D42',
  textMuted: '#7C8AA0',
  textFaint: '#B7C0D1',
  border: '#E7ECF3',
  radius: 20,
  radiusSm: 14,
  radiusSmInner: 11,
  success: '#15803D',
  successBg: '#DCFCE7',
  error: '#B91C1C',
  errorBg: '#FEE2E2',
  shadow: '0 1px 3px rgba(31,45,66,0.06), 0 10px 26px rgba(31,45,66,0.08)',
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
