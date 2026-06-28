// ============================================================
//  Utility functions: formats recipe fields retrieved from Supabase into the display shape
//  No React or Supabase dependencies, safe to import anywhere
// ============================================================

export const ALL_CATEGORY = '全部';
export const DOW = ['日', '一', '二', '三', '四', '五', '六'];

export function normalizeRecipe(recipe) {
  return {
    ...recipe,
    category: Array.isArray(recipe.category) ? recipe.category : [],
    yield_info: recipe.yield_info || [],
    parameters: recipe.parameters || {},
    is_shared: !!recipe.is_shared,
    user_id: recipe.user_id || null,
  };
}

export function getAvailableCategories(recipes) {
  const allTags = recipes.flatMap((r) => (Array.isArray(r.category) ? r.category : []));
  const cleanTags = allTags.map((t) => (t ? t.trim() : '')).filter(Boolean);
  return [...new Set(cleanTags)];
}

export function filterRecipes(recipes, selectedCategory, searchQuery) {
  const query = (searchQuery || '').trim().toLowerCase();
  return recipes
    .filter((recipe) => {
      const matchCategory = selectedCategory === ALL_CATEGORY || recipe.category.includes(selectedCategory);
      const matchSearch = !query
        || recipe.title.toLowerCase().includes(query)
        || recipe.category.some((tag) => tag.toLowerCase().includes(query));
      return matchCategory && matchSearch;
    })
    .sort((a, b) => {
      const timeA = a.last_cooked_at ? new Date(a.last_cooked_at).getTime() : 0;
      const timeB = b.last_cooked_at ? new Date(b.last_cooked_at).getTime() : 0;
      if (timeA !== timeB) {
        return timeB - timeA;
      }
      return a.title.localeCompare(b.title, 'zh-Hant');
    });
}

export function parseYieldInfo(yieldInfo) {
  if (!yieldInfo) return [];
  return Array.isArray(yieldInfo) ? yieldInfo : [];
}

export function parseIngredients(ingredients) {
  if (!ingredients) return [];
  if (Array.isArray(ingredients)) return ingredients;
  // Old data format: { name: amount } object
  return Object.entries(ingredients).map(([name, amount], index) => ({
    name, amount, is_base: index === 0, brand: '', type: '',
  }));
}

export function groupItemsByType(items) {
  if (items.length === 0) return [];
  const hasTypeInfo = items.some((it) => it.type && it.type.trim() !== '');
  if (!hasTypeInfo) return [{ typeName: 'DEFAULT', items }];
  const groupsMap = {};
  items.forEach((it) => {
    const currentType = it.type && it.type.trim() ? it.type.trim() : '其他';
    if (!groupsMap[currentType]) groupsMap[currentType] = [];
    groupsMap[currentType].push(it);
  });
  return Object.entries(groupsMap).map(([typeName, groupedItems]) => ({
    typeName, items: groupedItems,
  }));
}

export function parseSteps(steps) {
  if (!steps) return [];
  if (Array.isArray(steps) && typeof steps[0] === 'object') {
    return steps.map((s) => ({
      text: s.text || '',
      type: s.type || '',
      sort: Number(s.sort) || 1,
    }));
  }
  if (Array.isArray(steps) && typeof steps[0] === 'string') {
    return steps.map((s) => ({ text: s, type: '', sort: 1 }));
  }
  if (typeof steps === 'string') {
    return steps.split('\n').filter((s) => s.trim()).map((s) => ({ text: s, type: '', sort: 1 }));
  }
  return [];
}

export function groupStepsByType(steps) {
  if (steps.length === 0) return [];
  const hasTypeInfo = steps.some((s) => s.type && s.type.trim() !== '');
  if (!hasTypeInfo) return [{ typeName: 'DEFAULT', items: steps }];
  const groupsMap = {};
  steps.forEach((s) => {
    const currentType = s.type && s.type.trim() ? s.type.trim() : '其他';
    if (!groupsMap[currentType]) groupsMap[currentType] = [];
    groupsMap[currentType].push(s);
  });
  return Object.entries(groupsMap)
    .map(([typeName, items]) => ({ typeName, items, order: items[0]?.sort || 1 }))
    .sort((a, b) => a.order - b.order);
}

export function parseNotes(notes) {
  if (!notes) return [];
  if (Array.isArray(notes)) return notes.filter((n) => n.trim());
  return typeof notes === 'string' ? [notes] : [];
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayKey() {
  return dateKeyFrom(new Date());
}

export function dateKeyFrom(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function dateLabel(dateKey) {
  const date = parseDateKey(dateKey);
  return `${date.getMonth() + 1}/${date.getDate()}（${DOW[date.getDay()]}）`;
}

export function monthLabel(year, monthIndex) {
  return `${year} 年 ${monthIndex + 1} 月`;
}

export function getMonthDays(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < startOffset; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, monthIndex, day);
    cells.push(dateKeyFrom(date));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}
