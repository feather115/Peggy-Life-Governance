// ============================================================
//  Utility functions: date, greetings, percentages, empty day structure
//  No React or Supabase dependencies, safe to import anywhere
// ============================================================

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
