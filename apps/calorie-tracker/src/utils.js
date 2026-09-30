// ============================================================
//  Utility functions: date, greetings, percentages, empty day structure
//  No React or Supabase dependencies, safe to import anywhere
// ============================================================

import { toast } from '@peggy-life/shared/feedback.jsx';
import { DOW } from './constants.js';

// Today's date key, format YYYY-MM-DD (maps to day_records.date in the database)
export function todayKey() {
  return dkFrom(new Date());
}

// Converts a Date object to YYYY-MM-DD format
export function dkFrom(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Parses a YYYY-MM-DD string back to a local Date object
export function parseDk(dk) {
  const p = dk.split('-');
  return new Date(+p[0], +p[1] - 1, +p[2]);
}

// Formatted date string, e.g. "6/24 (Wed)"
export function dateLabel(dk) {
  const d = parseDk(dk);
  return `${d.getMonth() + 1}/${d.getDate()} (${DOW[d.getDay()]})`;
}

// Returns greeting text based on the current hour
export function greeting() {
  const h = new Date().getHours();
  return h < 5 ? '夜深了' : h < 11 ? '早安' : h < 14 ? '午安' : h < 18 ? '下午好' : h < 22 ? '晚安' : '夜深了';
}

// Percentage calculator (0-100, safe division by zero)
export const pct = (v, g) => Math.max(0, Math.min(100, Math.round((v / (g || 1)) * 100)));

// Default memory structure for an empty day (recordId is null before database write)
export function emptyDay() {
  return {
    recordId: null,
    meals: { breakfast: [], lunch: [], dinner: [], snack: [], midnight: [] },
    dayNote: '',
    tags: { activeTags: [] },
  };
}

// 在使用者自選的顏色（標籤色、挑戰成員色）上放文字：深字、白字挑對比高的那個。
// 淺黃、淺藍這類底色配白字會看不清楚（#E8A13C 配白字只有 2.2:1）。只認 #RRGGBB，CSS 變數（主色/資訊色）本身夠深，一律白字。
export function readableOn(color) {
  const m = /^#([0-9a-f]{6})$/i.exec(color || '');
  if (!m) return '#fff';
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(m[1].slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const onWhite = 1.05 / (lum + 0.05);
  const onDark = (lum + 0.05) / (0.0056 + 0.05); // #111
  return onDark > onWhite ? '#111' : '#fff';
}

// 寫入失敗時的共用提示：不要默默失敗（畫面看起來只會像「沒反應」）。用 app 內的紅色 toast，不用原生 alert。
export function alertError(action, e) {
  toast(`${action}失敗：${e?.message || '請稍後再試'}`, { tone: 'error' });
}
