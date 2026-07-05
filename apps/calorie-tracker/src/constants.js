// ============================================================
//  Static constants: meals, built-in foods, days of week
//  Modify "built-in foods" or "meal icons/names" here
// ============================================================

export const DOW = ['日', '一', '二', '三', '四', '五', '六'];

// Five meal types. The key must match the check constraint on meal_items.meal_key in the database.
export const MEALS_DEF = [
  { key: 'breakfast', label: '早餐', icon: '🥣', iconBg: '#FFF1D6', eh: '今天還沒吃早餐喔' },
  { key: 'lunch',     label: '午餐', icon: '🥗', iconBg: '#E3F2E9', eh: '尚未記錄' },
  { key: 'dinner',    label: '晚餐', icon: '🍱', iconBg: '#FDE6E0', eh: '尚未記錄' },
  { key: 'snack',     label: '點心', icon: '🍎', iconBg: '#F2E6FB', eh: '尚未記錄' },
  { key: 'midnight',  label: '宵夜', icon: '🌙', iconBg: '#E3EAFB', eh: '想吃就記，誠實面對' },
];

// Built-in food library. Adding to a meal stores a "snapshot" of the values (not a foreign key),
// but the id itself IS persisted as a plain string in meal_items.food_ref / food_usage.food_ref
// (e.g. 'egg') — so don't rename existing ids, or usage-based sorting loses track of them.
export const FOODS = [
  { id: 'egg',          name: '水煮蛋',     unit: '1 顆',  cal: 78,  p: 6,  c: 1,  f: 5 },
  { id: 'chicken',      name: '雞胸肉',     unit: '150g',  cal: 165, p: 31, c: 0,  f: 4 }
];
