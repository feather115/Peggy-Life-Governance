// ============================================================
//  靜態常數：餐別、內建食物庫、星期
//  改「內建食物」「餐別圖示/名稱」就改這裡
// ============================================================

export const DOW = ['日', '一', '二', '三', '四', '五', '六'];

// 五個餐別。key 必須與資料庫 meal_items.meal_key 的 check 約束一致。
export const MEALS_DEF = [
  { key: 'breakfast', label: '早餐', icon: '🥣', iconBg: '#FFF1D6', eh: '今天還沒吃早餐喔' },
  { key: 'lunch',     label: '午餐', icon: '🥗', iconBg: '#E3F2E9', eh: '尚未記錄' },
  { key: 'dinner',    label: '晚餐', icon: '🍱', iconBg: '#FDE6E0', eh: '尚未記錄' },
  { key: 'snack',     label: '點心', icon: '🍎', iconBg: '#F2E6FB', eh: '尚未記錄' },
  { key: 'midnight',  label: '宵夜', icon: '🌙', iconBg: '#E3EAFB', eh: '想吃就記，誠實面對' },
];

// 內建食物庫（id 為純前端用途，不會寫進資料庫；加入餐點時是以「快照」存值）
export const FOODS = [
  { id: 'egg',          name: '水煮蛋',     unit: '1 顆',  cal: 78,  p: 6,  c: 1,  f: 5 },
  { id: 'chicken',      name: '雞胸肉',     unit: '150g',  cal: 165, p: 31, c: 0,  f: 4 }
];
