// ============================================================
//  useDiary — 日記與標籤分類的狀態中樞
//  載入日記/分類、新增/編輯/刪除日記、分類與標籤管理全部從這裡出來。
//  元件不直接呼叫 db.js，一律透過這個 hook 回傳的 state/action。
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import * as db from './db.js';
import { groupDiaryByDate } from './utils.js';

// 新使用者第一次使用時的預設分類（跟其他使用者互不影響，只是省去從零開始建立的麻煩）
const DEFAULT_CATEGORIES = [
  { name: '工作', tags: ['加班', '公出', '病假', '休假', '居家辦公'] },
  { name: '社交', tags: ['聚餐', '出遊', '購物', '電影', '聚會', '旅行'] },
  { name: '心情', tags: ['好心情', '不開心', '疲累', '充實', '放鬆'] },
  { name: '健康', tags: ['運動', '回診', '吃藥', '睡眠不足'] },
];

export function useDiary(userId) {
  const [entries, setEntries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancel = false;
    Promise.all([db.loadDiaryEntries(userId), db.loadCategories(userId)])
      .then(async ([entryRows, categoryRows]) => {
        if (cancel) return;
        setEntries(entryRows);
        if (categoryRows.length === 0) {
          // 第一次使用，沒有任何分類 → 種一組預設分類
          try {
            const seeded = await db.createCategories(userId, DEFAULT_CATEGORIES);
            if (!cancel) setCategories(seeded);
          } catch (e) {
            if (!cancel) { console.warn('預設分類建立失敗：', e.message); setCategories([]); }
          }
        } else {
          setCategories(categoryRows);
        }
        setLoaded(true);
      })
      .catch((e) => {
        if (cancel) return;
        console.error('日記資料載入失敗：', e.message);
        setLoadError(e.message || '載入失敗');
        setLoaded(true);
      });
    return () => { cancel = true; };
  }, [userId]);

  const entriesByDate = useMemo(() => groupDiaryByDate(entries), [entries]);

  const createEntry = useCallback(async (payload) => {
    const created = await db.createDiaryEntry(userId, payload);
    setEntries((prev) => [...prev, created]);
    return created;
  }, [userId]);

  const updateEntry = useCallback(async (entryId, patch) => {
    const updated = await db.updateDiaryEntry(entryId, patch);
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    return updated;
  }, []);

  const deleteEntry = useCallback(async (entryId) => {
    await db.deleteDiaryEntry(entryId);
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  }, []);

  const addCategory = useCallback(async (name) => {
    const nextOrder = categories.length ? Math.max(...categories.map((c) => c.sort_order ?? 0)) + 1 : 0;
    const [created] = await db.createCategories(userId, [{ name, tags: [] }], nextOrder);
    setCategories((prev) => [...prev, created]);
    return created;
  }, [userId, categories]);

  const renameCategory = useCallback(async (categoryId, name) => {
    const updated = await db.updateCategory(categoryId, { name });
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    return updated;
  }, []);

  const deleteCategory = useCallback(async (categoryId) => {
    await db.deleteCategory(categoryId);
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    // 被刪掉分類底下的標籤，從既有日記裡也拿掉，避免殘留孤兒標籤
    const removedTags = new Set((categories.find((c) => c.id === categoryId)?.tags) || []);
    if (removedTags.size > 0) {
      setEntries((prev) => prev.map((e) => ({ ...e, tags: (e.tags || []).filter((t) => !removedTags.has(t)) })));
    }
  }, [categories]);

  const moveCategory = useCallback(async (categoryId, direction) => {
    const idx = categories.findIndex((c) => c.id === categoryId);
    const targetIdx = idx + direction;
    if (idx === -1 || targetIdx < 0 || targetIdx >= categories.length) return;
    const a = categories[idx];
    const b = categories[targetIdx];
    const [updatedA, updatedB] = await Promise.all([
      db.updateCategory(a.id, { sort_order: b.sort_order }),
      db.updateCategory(b.id, { sort_order: a.sort_order }),
    ]);
    setCategories((prev) => {
      const next = prev.map((c) => {
        if (c.id === updatedA.id) return updatedA;
        if (c.id === updatedB.id) return updatedB;
        return c;
      });
      return next.slice().sort((x, y) => x.sort_order - y.sort_order);
    });
  }, [categories]);

  const addTagToCategory = useCallback(async (categoryId, tag) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat || cat.tags.includes(tag)) return;
    const updated = await db.updateCategory(categoryId, { tags: [...cat.tags, tag] });
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, [categories]);

  const moveTagToCategory = useCallback(async (tag, fromCategoryId, toCategoryId) => {
    const from = categories.find((c) => c.id === fromCategoryId);
    const to = categories.find((c) => c.id === toCategoryId);
    if (!from || !to || to.tags.includes(tag)) return;
    const [updatedFrom, updatedTo] = await Promise.all([
      db.updateCategory(fromCategoryId, { tags: from.tags.filter((t) => t !== tag) }),
      db.updateCategory(toCategoryId, { tags: [...to.tags, tag] }),
    ]);
    setCategories((prev) => prev.map((c) => {
      if (c.id === updatedFrom.id) return updatedFrom;
      if (c.id === updatedTo.id) return updatedTo;
      return c;
    }));
  }, [categories]);

  const moveTagInCategory = useCallback(async (categoryId, tag, direction) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    const idx = cat.tags.indexOf(tag);
    const targetIdx = idx + direction;
    if (idx === -1 || targetIdx < 0 || targetIdx >= cat.tags.length) return;
    const nextTags = cat.tags.slice();
    [nextTags[idx], nextTags[targetIdx]] = [nextTags[targetIdx], nextTags[idx]];
    const updated = await db.updateCategory(categoryId, { tags: nextTags });
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, [categories]);

  const removeTagFromCategory = useCallback(async (categoryId, tag) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    const updated = await db.updateCategory(categoryId, { tags: cat.tags.filter((t) => t !== tag) });
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    // 這個標籤如果被用在既有日記上，一併移除
    setEntries((prev) => prev.map((e) => ({ ...e, tags: (e.tags || []).filter((t) => t !== tag) })));
  }, [categories]);

  return {
    loaded, loadError, entries, entriesByDate, categories,
    createEntry, updateEntry, deleteEntry,
    addCategory, renameCategory, deleteCategory, moveCategory,
    addTagToCategory, removeTagFromCategory, moveTagToCategory, moveTagInCategory,
  };
}
