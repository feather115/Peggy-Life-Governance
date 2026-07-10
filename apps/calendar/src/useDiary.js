// ============================================================
//  useDiary — 日記與標籤分類的狀態中樞
//  載入日記/分類、新增/編輯/刪除日記、分類與標籤管理全部從這裡出來。
//  元件不直接呼叫 db.js，一律透過這個 hook 回傳的 state/action。
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import * as db from './db.js';
import { groupDiaryByDate } from './utils.js';

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
        console.error('日記資料載入失敗：', e.message);
        setLoadError(e.message || '載入失敗');
        setLoaded(true);
      });
    return () => { cancel = true; };
  }, [userId]);

  const entriesByDate = useMemo(() => groupDiaryByDate(entries), [entries]);

  // tag → 過去填過的細節文字（去重、最近的排前面），給 DiaryForm 的細節輸入框做自動建議用
  const tagDetailHistory = useMemo(() => {
    const sorted = entries.slice().sort((a, b) => (b.entry_date || '').localeCompare(a.entry_date || ''));
    const map = new Map();
    sorted.forEach((e) => {
      Object.entries(e.tag_details || {}).forEach(([tag, detail]) => {
        if (!detail) return;
        if (!map.has(tag)) map.set(tag, []);
        const arr = map.get(tag);
        if (!arr.includes(detail)) arr.push(detail);
      });
    });
    return map;
  }, [entries]);

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

  // 選項庫改名時同步改寫過去日記的欄位值（field: 'locations' | 'people'，都是 text[]）
  const renameFieldValue = useCallback(async (field, oldName, newName) => {
    const affected = entries.filter((e) => (e[field] || []).includes(oldName));
    if (affected.length === 0) return;
    const updated = await Promise.all(affected.map((e) => {
      const patch = { [field]: [...new Set(e[field].map((v) => (v === oldName ? newName : v)))] };
      return db.updateDiaryEntry(e.id, patch);
    }));
    setEntries((prev) => prev.map((e) => updated.find((u) => u.id === e.id) || e));
  }, [entries]);

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
    // 被刪掉分類底下的標籤（含子標籤），從既有日記裡也拿掉，避免殘留孤兒標籤
    const removedTags = new Set(((categories.find((c) => c.id === categoryId)?.tags) || []).flatMap((t) => [t.name, ...t.subs]));
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

  // 更新某分類的 tags 並同步 state（所有標籤/子標籤操作的共用底層）
  const saveTags = useCallback(async (categoryId, nextTags) => {
    const updated = await db.updateCategory(categoryId, { tags: nextTags });
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  // 標籤改名時同步所有引用它的日記：tags 陣列裡的字串、tag_details 的 key，兩邊都要改
  const syncEntriesTagRename = useCallback(async (oldTag, newTag) => {
    const affected = entries.filter((e) => (e.tags || []).includes(oldTag));
    if (affected.length === 0) return;
    const updated = await Promise.all(affected.map((e) => {
      const nextEntryTags = e.tags.map((t) => (t === oldTag ? newTag : t));
      const nextDetails = { ...(e.tag_details || {}) };
      if (oldTag in nextDetails) {
        nextDetails[newTag] = nextDetails[oldTag];
        delete nextDetails[oldTag];
      }
      return db.updateDiaryEntry(e.id, { tags: nextEntryTags, tag_details: nextDetails });
    }));
    setEntries((prev) => prev.map((e) => updated.find((u) => u.id === e.id) || e));
  }, [entries]);

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
    await syncEntriesTagRename(oldTag, newTag);
  }, [categories, saveTags, syncEntriesTagRename]);

  const removeTagFromCategory = useCallback(async (categoryId, tag) => {
    const cat = categories.find((c) => c.id === categoryId);
    const removing = cat?.tags.find((t) => t.name === tag);
    if (!cat || !removing) return;
    await saveTags(categoryId, cat.tags.filter((t) => t.name !== tag));
    // 這個標籤（含子標籤）如果被用在既有日記上，一併移除
    const removed = new Set([removing.name, ...removing.subs]);
    setEntries((prev) => prev.map((e) => ({ ...e, tags: (e.tags || []).filter((t) => !removed.has(t)) })));
  }, [categories, saveTags]);

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
    await syncEntriesTagRename(oldSub, newSub);
  }, [categories, saveTags, syncEntriesTagRename]);

  const removeSubTag = useCallback(async (categoryId, parentTag, sub) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    await saveTags(categoryId, cat.tags.map((t) => (t.name === parentTag ? { ...t, subs: t.subs.filter((s) => s !== sub) } : t)));
    setEntries((prev) => prev.map((e) => ({ ...e, tags: (e.tags || []).filter((t) => t !== sub) })));
  }, [categories, saveTags]);

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
    loaded, loadError, entries, entriesByDate, categories, tagDetailHistory,
    createEntry, updateEntry, deleteEntry, renameFieldValue,
    addCategory, renameCategory, deleteCategory, moveCategory,
    addTagToCategory, removeTagFromCategory, moveTagToCategory, moveTagInCategory, renameTagInCategory,
    addSubTag, renameSubTag, removeSubTag, moveSubTag,
  };
}
