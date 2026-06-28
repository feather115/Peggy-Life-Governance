// ============================================================
//  純工具函式：把 Supabase 抓回來的 recipe 欄位整理成畫面需要的形狀
//  沒有 React、沒有 Supabase 依賴，可隨意 import
// ============================================================

export const ALL_CATEGORY = '全部';

export function normalizeRecipe(recipe) {
  return {
    ...recipe,
    category: Array.isArray(recipe.category) ? recipe.category : [],
    yield_info: recipe.yield_info || [],
    parameters: recipe.parameters || {},
  };
}

export function getAvailableCategories(recipes) {
  const allTags = recipes.flatMap((r) => (Array.isArray(r.category) ? r.category : []));
  const cleanTags = allTags.map((t) => (t ? t.trim() : '')).filter(Boolean);
  return [...new Set(cleanTags)];
}

export function filterRecipes(recipes, selectedCategory, searchQuery) {
  const query = (searchQuery || '').trim().toLowerCase();
  return recipes.filter((recipe) => {
    const matchCategory = selectedCategory === ALL_CATEGORY || recipe.category.includes(selectedCategory);
    const matchSearch = !query
      || recipe.title.toLowerCase().includes(query)
      || recipe.category.some((tag) => tag.toLowerCase().includes(query));
    return matchCategory && matchSearch;
  });
}

export function parseYieldInfo(yieldInfo) {
  if (!yieldInfo) return [];
  return Array.isArray(yieldInfo) ? yieldInfo : [];
}

export function parseIngredients(ingredients) {
  if (!ingredients) return [];
  if (Array.isArray(ingredients)) return ingredients;
  // 舊資料格式：{ name: amount } 物件
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
