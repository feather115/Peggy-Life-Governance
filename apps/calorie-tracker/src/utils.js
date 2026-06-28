// ============================================================
//  純工具函式：日期、問候語、百分比、空白日結構
//  沒有 React、沒有 Supabase 依賴，可隨意 import
// ============================================================

import { DOW } from './constants.js';

// 今天的日期 key，格式 YYYY-MM-DD（對應資料庫 day_records.date）
export function todayKey() {
  return dkFrom(new Date());
}

// 把 Date 物件轉成 YYYY-MM-DD
export function dkFrom(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 把 YYYY-MM-DD 轉回 Date 物件（本地時區）
export function parseDk(dk) {
  const p = dk.split('-');
  return new Date(+p[0], +p[1] - 1, +p[2]);
}

// 日期顯示字串，例如 "6/24 (三)"
export function dateLabel(dk) {
  const d = parseDk(dk);
  return `${d.getMonth() + 1}/${d.getDate()} (${DOW[d.getDay()]})`;
}

// 依現在時間給問候語
export function greeting() {
  const h = new Date().getHours();
  return h < 5 ? '夜深了' : h < 11 ? '早安' : h < 14 ? '午安' : h < 18 ? '下午好' : h < 22 ? '晚安' : '夜深了';
}

// 百分比（0~100，安全處理除以 0）
export const pct = (v, g) => Math.max(0, Math.min(100, Math.round((v / (g || 1)) * 100)));

// 一個空白的「某天」記憶體結構（尚未寫入資料庫時 recordId 為 null）
export function emptyDay() {
  return {
    recordId: null,
    meals: { breakfast: [], lunch: [], dinner: [], snack: [], midnight: [] },
    dayNote: '',
    tags: { activeTags: [] },
  };
}
