// ============================================================
//  useDiaryTags — 日記「分類標籤字彙」的狀態中樞（tag_categories 表）
//  只管標籤分類本身（三層：分類→主標籤→子標籤）；標籤實際被貼在哪筆紀錄
//  存在 useRecords 的 diary_tags，改名/刪除標籤時透過 recordSync 回呼同步過去紀錄。
//  元件不直接呼叫 db.js，一律透過這個 hook 回傳的 state/action。
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import * as db from './db.js';

// 新使用者第一次使用時的預設分類（跟其他使用者互不影響，只是省去從零開始建立的麻煩）
// tags 是 [{ name, subs: [] }]：主標籤 + 子標籤兩層（2026-07-09 起 jsonb，見 migration）
const seedTags = (names) => names.map((n) => ({ name: n, subs: [] }));
const DEFAULT_CATEGORIES = [
  { name: '工作', tags: seedTags(['加班', '公出', '病假', '休假', '居家辦公']) },
  { name: '社交', tags: seedTags(['聚餐', '出遊', '購物', '電影', '聚會', '旅行']) },
  { name: '心情', tags: seedTags(['好心情', '不開心', '疲累', '充實', '放鬆']) },
  { name: '健康', tags: seedTags(['運動', '回診', '吃藥', '睡眠不足']) },
];

// migration 還沒跑（tags 還是純字串陣列）時把舊格式包成新格式，讀取不會壞（寫入仍需先跑 migration）
const normalizeCategories = (rows) => rows.map((c) => ({
  ...c,
  tags: (c.tags || []).map((t) => (typeof t === 'string' ? { name: t, subs: [] } : { name: t.name, subs: t.subs || [] })),
}));

// 名稱（主標籤或子標籤）已被哪個分類使用；沒有回傳 null。標籤名稱全域唯一的檢查都走這裡。
export function findTagOwner(categories, name) {
  for (const c of categories) {
    for (const t of c.tags) {
      if (t.name === name) return { category: c, isSub: false };
      if (t.subs.includes(name)) return { category: c, isSub: true, parent: t.name };
    }
  }
  return null;
}

// recordSync：{ renameTag(oldTag, newTag), removeTags(Set<string>) }——把分類標籤的改名/刪除
// 同步到過去紀錄的 diary_tags（實作在 useRecords）。
export function useDiaryTags(userId, recordSync) {
  const [categories, setCategories] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancel = false;
    db.loadCategories(userId)
      .then(async (categoryRows) => {
        if (cancel) return;
        if (categoryRows.length === 0) {
          // 第一次使用，沒有任何分類 → 種一組預設分類
          try {
            const seeded = await db.createCategories(userId, DEFAULT_CATEGORIES);
            if (!cancel) setCategories(normalizeCategories(seeded));
          } catch (e) {
            if (!cancel) { console.warn('預設分類建立失敗：', e.message); setCategories([]); }
          }
        } else {
          setCategories(normalizeCategories(categoryRows));
        }
        setLoaded(true);
      })
      .catch((e) => {
        if (cancel) return;
        console.error('分類標籤載入失敗：', e.message);
        setLoadError(e.message || '載入失敗');
        setLoaded(true);
      });
    return () => { cancel = true; };
  }, [userId]);

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
    // 被刪掉分類底下的標籤（含子標籤），從既有紀錄的 diary_tags 也拿掉，避免殘留孤兒標籤
    const removedTags = new Set(((categories.find((c) => c.id === categoryId)?.tags) || []).flatMap((t) => [t.name, ...t.subs]));
    recordSync.removeTags(removedTags);
  }, [categories, recordSync]);

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

  // 更新某分類的 tags 並同步 state（所有標籤/子標籤操作的共用底層）
  const saveTags = useCallback(async (categoryId, nextTags) => {
    const updated = await db.updateCategory(categoryId, { tags: nextTags });
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  const addTagToCategory = useCallback(async (categoryId, tag) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat || findTagOwner(categories, tag)) return;
    await saveTags(categoryId, [...cat.tags, { name: tag, subs: [] }]);
  }, [categories, saveTags]);

  const moveTagToCategory = useCallback(async (tag, fromCategoryId, toCategoryId) => {
    const from = categories.find((c) => c.id === fromCategoryId);
    const to = categories.find((c) => c.id === toCategoryId);
    const moving = from?.tags.find((t) => t.name === tag);
    if (!from || !to || !moving || to.tags.some((t) => t.name === tag)) return;
    const [updatedFrom, updatedTo] = await Promise.all([
      db.updateCategory(fromCategoryId, { tags: from.tags.filter((t) => t.name !== tag) }),
      db.updateCategory(toCategoryId, { tags: [...to.tags, moving] }),
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
    const idx = cat.tags.findIndex((t) => t.name === tag);
    const targetIdx = idx + direction;
    if (idx === -1 || targetIdx < 0 || targetIdx >= cat.tags.length) return;
    const nextTags = cat.tags.slice();
    [nextTags[idx], nextTags[targetIdx]] = [nextTags[targetIdx], nextTags[idx]];
    await saveTags(categoryId, nextTags);
  }, [categories, saveTags]);

  const renameTagInCategory = useCallback(async (categoryId, oldTag, newTag) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat || !cat.tags.some((t) => t.name === oldTag) || oldTag === newTag) return;
    if (findTagOwner(categories, newTag)) return;
    await saveTags(categoryId, cat.tags.map((t) => (t.name === oldTag ? { ...t, name: newTag } : t)));
    await recordSync.renameTag(oldTag, newTag);
  }, [categories, saveTags, recordSync]);

  const removeTagFromCategory = useCallback(async (categoryId, tag) => {
    const cat = categories.find((c) => c.id === categoryId);
    const removing = cat?.tags.find((t) => t.name === tag);
    if (!cat || !removing) return;
    await saveTags(categoryId, cat.tags.filter((t) => t.name !== tag));
    // 這個標籤（含子標籤）如果被用在既有紀錄上，一併移除
    recordSync.removeTags(new Set([removing.name, ...removing.subs]));
  }, [categories, saveTags, recordSync]);

  // ---- 子標籤 ----

  const addSubTag = useCallback(async (categoryId, parentTag, sub) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat || findTagOwner(categories, sub)) return;
    await saveTags(categoryId, cat.tags.map((t) => (t.name === parentTag ? { ...t, subs: [...t.subs, sub] } : t)));
  }, [categories, saveTags]);

  const renameSubTag = useCallback(async (categoryId, parentTag, oldSub, newSub) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat || oldSub === newSub || findTagOwner(categories, newSub)) return;
    await saveTags(categoryId, cat.tags.map((t) => (
      t.name === parentTag ? { ...t, subs: t.subs.map((s) => (s === oldSub ? newSub : s)) } : t
    )));
    await recordSync.renameTag(oldSub, newSub);
  }, [categories, saveTags, recordSync]);

  const removeSubTag = useCallback(async (categoryId, parentTag, sub) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    await saveTags(categoryId, cat.tags.map((t) => (t.name === parentTag ? { ...t, subs: t.subs.filter((s) => s !== sub) } : t)));
    recordSync.removeTags(new Set([sub]));
  }, [categories, saveTags, recordSync]);

  const moveSubTag = useCallback(async (categoryId, parentTag, sub, direction) => {
    const cat = categories.find((c) => c.id === categoryId);
    const parent = cat?.tags.find((t) => t.name === parentTag);
    if (!cat || !parent) return;
    const idx = parent.subs.indexOf(sub);
    const targetIdx = idx + direction;
    if (idx === -1 || targetIdx < 0 || targetIdx >= parent.subs.length) return;
    const nextSubs = parent.subs.slice();
    [nextSubs[idx], nextSubs[targetIdx]] = [nextSubs[targetIdx], nextSubs[idx]];
    await saveTags(categoryId, cat.tags.map((t) => (t.name === parentTag ? { ...t, subs: nextSubs } : t)));
  }, [categories, saveTags]);

  return {
    loaded, loadError, categories,
    addCategory, renameCategory, deleteCategory, moveCategory,
    addTagToCategory, removeTagFromCategory, moveTagToCategory, moveTagInCategory, renameTagInCategory,
    addSubTag, renameSubTag, removeSubTag, moveSubTag,
  };
}
