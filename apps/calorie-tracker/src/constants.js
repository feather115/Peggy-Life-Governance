// ============================================================
//  Static constants: meals, built-in foods, days of week
//  Modify "built-in foods" or "meal names" here
// ============================================================

export const DOW = ['日', '一', '二', '三', '四', '五', '六'];

// Five meal types. The key must match the check constraint on meal_items.meal_key in the database.
// （2026-09-30 改版拿掉餐別 emoji 圖示與空狀態文案：清單尾端的「＋ 加入早餐」列就是空狀態）
export const MEALS_DEF = [
  { key: 'breakfast', label: '早餐' },
  { key: 'lunch',     label: '午餐' },
  { key: 'dinner',    label: '晚餐' },
  { key: 'snack',     label: '點心' },
  { key: 'midnight',  label: '宵夜' },
];

// Built-in food library. Adding to a meal stores a "snapshot" of the values (not a foreign key),
// but the id itself IS persisted as a plain string in meal_items.food_ref / food_usage.food_ref
// (e.g. 'egg') — so don't rename existing ids, or usage-based sorting loses track of them.
export const FOODS = [
  { id: 'egg',          name: '水煮蛋',     unit: '1 顆',  cal: 78,  p: 6,  c: 1,  f: 5 },
  { id: 'chicken',      name: '雞胸肉',     unit: '150g',  cal: 165, p: 31, c: 0,  f: 4 }
];
