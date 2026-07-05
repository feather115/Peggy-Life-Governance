// ============================================================
//  useRecipes — The state hub for recipes list
//  Handles loading recipes, searching/filtering by category, and URL sync for viewing details.
//  Components do not call db.js directly, but use the state/action returned by this hook.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import * as db from './db.js';
import {
  ALL_CATEGORY,
  displayNameFor,
  filterRecipes,
  getAvailableCategories,
} from './utils.js';

const OWNERSHIP_KEYS = ['mine_shared', 'mine_private', 'others_shared'];
const ownershipStorageKey = (uid) => `recipe-book:ownership-filter:${uid || 'guest'}`;

function loadOwnershipFilter(uid) {
  try {
    const raw = localStorage.getItem(ownershipStorageKey(uid));
    if (!raw) return new Set(OWNERSHIP_KEYS);
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set(OWNERSHIP_KEYS);
    return new Set(arr.filter((k) => OWNERSHIP_KEYS.includes(k)));
  } catch {
    return new Set(OWNERSHIP_KEYS);
  }
}

function getRecipeIdFromUrl() {
  return new URL(window.location.href).searchParams.get('recipe');
}

// recipeId=null → catalog URL; recipeId 有值 → detail URL
function buildUrl(recipeId) {
  const url = new URL(window.location.href);
  if (recipeId) url.searchParams.set('recipe', recipeId);
  else url.searchParams.delete('recipe');
  return url.toString();
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'instant' });
}

export function useRecipes(userId) {
  const isGuest = !userId;
  const [recipes, setRecipes] = useState([]);
  const [cookRecords, setCookRecords] = useState([]);
  const [likes, setLikes] = useState([]); // [{ recipe_id, user_id }]
  const [displayNameRows, setDisplayNameRows] = useState([]); // [{ user_id, display_name, email }]
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [cookRecordError, setCookRecordError] = useState('');

  // Search / Category / Ownership tab
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);
  const [ownershipFilter, setOwnershipFilterState] = useState(() => loadOwnershipFilter(userId));
  useEffect(() => { setOwnershipFilterState(loadOwnershipFilter(userId)); }, [userId]);
  const toggleOwnership = useCallback((key) => {
    setOwnershipFilterState((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try { localStorage.setItem(ownershipStorageKey(userId), JSON.stringify([...next])); } catch {}
      return next;
    });
  }, [userId]);

  // Navigation (catalog ↔ detail)
  const [currentView, setCurrentView] = useState('home');
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);

  // Initial load — queries are independent, so fire them in parallel (same pattern as
  // calorie-tracker's loadAll). Likes / names / cook records failing is non-fatal:
  // the catalog still renders, we just warn and fall back to empty lists.
  useEffect(() => {
    let cancel = false;
    setLoaded(false);
    setCookRecordError('');
    Promise.all([
      db.loadRecipes(),
      db.loadAllLikes().catch((e) => { console.warn('按讚資料載入失敗：', e.message); return []; }),
      // shared.user_profiles 的 RLS 只開放給 authenticated，訪客查了必定 permission denied，
      // 直接跳過（「誰按讚」對訪客顯示成「某人」是預期行為）
      isGuest
        ? Promise.resolve([])
        : db.loadDisplayNames().catch((e) => { console.warn('使用者暱稱載入失敗：', e.message); return []; }),
      isGuest
        ? Promise.resolve([])
        : db.loadCookRecords(userId).catch((e) => {
            console.warn('料理行事曆紀錄載入失敗：', e.message);
            if (!cancel) setCookRecordError(e.message || '行事曆紀錄載入失敗');
            return [];
          }),
    ])
      .then(([recipeRows, likeRows, nameRows, recordRows]) => {
        if (cancel) return;
        setRecipes(recipeRows);
        setLikes(likeRows);
        setDisplayNameRows(nameRows);
        setCookRecords(recordRows);
        setLoaded(true);
      })
      .catch((e) => {
        if (cancel) return;
        console.error('食譜載入失敗：', e.message);
        setLoadError(e.message || '載入失敗');
        setLoaded(true);
      });
    return () => { cancel = true; };
  }, [userId]);

  // Sync view with URL after loading is complete (supports opening URLs with ?recipe=xxx directly)
  useEffect(() => {
    if (!loaded) return;
    syncViewWithUrl(recipes);
    const handler = () => syncViewWithUrl(recipes);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, recipes]);

  function syncViewWithUrl(list) {
    const recipeId = getRecipeIdFromUrl();
    if (!recipeId) {
      setCurrentView('home');
      setSelectedRecipeId(null);
      return;
    }
    const found = list.find((r) => String(r.id) === String(recipeId));
    if (found) {
      setSelectedRecipeId(found.id);
      setCurrentView('detail');
      scrollToTop();
      return;
    }
    if (list.length > 0) {
      window.history.replaceState({ view: 'home' }, '', buildUrl(null));
      setCurrentView('home');
      setSelectedRecipeId(null);
    }
  }

  const openRecipeDetail = useCallback((recipe) => {
    setSelectedRecipeId(recipe.id);
    setCurrentView('detail');
    scrollToTop();
    window.history.pushState({ view: 'detail', recipeId: recipe.id }, '', buildUrl(recipe.id));
  }, []);

  // 某道食譜的 cooking_history 有增減後，重新算出最新的 cooked_date 並同步回 recipes.last_cooked_at
  // （只有自己的食譜才會寫回 DB；別人分享的食譜沒有寫入權限）
  const syncLastCookedAt = useCallback((recipeId, nextRecords) => {
    const recipe = recipes.find((r) => String(r.id) === String(recipeId));
    if (!recipe || !userId || recipe.user_id !== userId) return;

    const recipeRecords = nextRecords.filter((r) => String(r.recipe_id) === String(recipeId));
    const latestDate = recipeRecords.length > 0
      ? recipeRecords.reduce((max, r) => r.cooked_date.localeCompare(max) > 0 ? r.cooked_date : max, recipeRecords[0].cooked_date)
      : null;

    db.updateRecipe(recipeId, { last_cooked_at: latestDate })
      .then((updated) => {
        setRecipes((prevRecipes) => prevRecipes.map((r) => r.id === updated.id ? updated : r));
      })
      .catch((err) => {
        console.warn('Failed to update last_cooked_at in DB:', err);
      });
  }, [userId, recipes]);

  const addCookRecord = useCallback(async (cookedOn, recipeId) => {
    let saved;
    try {
      saved = await db.addCookRecord(userId, cookedOn, recipeId);
      setCookRecordError('');
    } catch (e) {
      setCookRecordError(e.message || '料理紀錄新增失敗');
      throw e;
    }
    // Compute the next list outside the setState updater — updaters must stay pure
    // (React can invoke them more than once), so the syncLastCookedAt DB write lives out here.
    const withoutDuplicate = cookRecords.filter((record) => !(
      record.cooked_date === saved.cooked_date && record.recipe_id === saved.recipe_id
    ));
    const nextRecords = [...withoutDuplicate, saved].sort((a, b) => {
      if (a.cooked_date !== b.cooked_date) return b.cooked_date.localeCompare(a.cooked_date);
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    setCookRecords(nextRecords);
    syncLastCookedAt(recipeId, nextRecords);
  }, [userId, cookRecords, syncLastCookedAt]);

  const saveRecipe = useCallback(async (payload, existingId) => {
    if (existingId) {
      const updated = await db.updateRecipe(existingId, payload);
      setRecipes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      return updated;
    }
    const created = await db.createRecipe(userId, payload);
    setRecipes((prev) => [...prev, created]);
    return created;
  }, [userId]);

  const deleteRecipeById = useCallback(async (recipeId) => {
    await db.deleteRecipe(recipeId);
    setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
    if (selectedRecipeId === recipeId) {
      setSelectedRecipeId(null);
      setCurrentView('home');
      window.history.replaceState({ view: 'home' }, '', buildUrl(null));
    }
  }, [selectedRecipeId]);

  const removeCookRecord = useCallback(async (recordId) => {
    const recordToRemove = cookRecords.find((r) => r.id === recordId);
    try {
      await db.removeCookRecord(recordId);
      setCookRecordError('');
    } catch (e) {
      setCookRecordError(e.message || '料理紀錄刪除失敗');
      throw e;
    }
    const nextRecords = cookRecords.filter((record) => record.id !== recordId);
    setCookRecords(nextRecords);
    if (recordToRemove) syncLastCookedAt(recordToRemove.recipe_id, nextRecords);
  }, [cookRecords, syncLastCookedAt]);

  const updateCookRecordNotes = useCallback(async (recordId, notes) => {
    try {
      const updated = await db.updateCookRecordNotes(recordId, notes);
      setCookRecords((prev) => prev.map((record) => record.id === recordId ? updated : record));
      setCookRecordError('');
      return updated;
    } catch (e) {
      setCookRecordError(e.message || '備註更新失敗');
      throw e;
    }
  }, []);

  const recipesWithLastCooked = useMemo(() => {
    const latestByRecipe = {};
    cookRecords.forEach((record) => {
      const rid = String(record.recipe_id);
      const d = record.cooked_date;
      if (!latestByRecipe[rid] || d.localeCompare(latestByRecipe[rid]) > 0) {
        latestByRecipe[rid] = d;
      }
    });

    return recipes.map((recipe) => {
      const rid = String(recipe.id);
      const latest = latestByRecipe[rid];
      if (!isGuest) {
        return {
          ...recipe,
          last_cooked_at: latest || recipe.last_cooked_at,
        };
      }
      return recipe;
    });
  }, [recipes, cookRecords, isGuest]);

  const availableCategories = useMemo(() => getAvailableCategories(recipesWithLastCooked), [recipesWithLastCooked]);

  const likeCounts = useMemo(() => {
    const m = new Map();
    likes.forEach((l) => m.set(l.recipe_id, (m.get(l.recipe_id) || 0) + 1));
    return m;
  }, [likes]);
  const myLikedSet = useMemo(() => {
    const s = new Set();
    if (!userId) return s;
    likes.forEach((l) => { if (l.user_id === userId) s.add(l.recipe_id); });
    return s;
  }, [likes, userId]);

  const displayNamesMap = useMemo(() => {
    const m = new Map();
    displayNameRows.forEach((row) => m.set(row.user_id, row));
    return m;
  }, [displayNameRows]);

  // recipe_id → [顯示名稱, ...]，給 RecipeDetail 的「誰按讚」用
  const likerNamesByRecipe = useMemo(() => {
    const m = new Map();
    likes.forEach((l) => {
      const name = displayNameFor(l.user_id, displayNamesMap);
      if (!m.has(l.recipe_id)) m.set(l.recipe_id, []);
      m.get(l.recipe_id).push(name);
    });
    return m;
  }, [likes, displayNamesMap]);

  const filteredRecipes = useMemo(
    () => filterRecipes(recipesWithLastCooked, { category: selectedCategory, search: searchQuery, ownershipSet: ownershipFilter, currentUserId: userId, myLikedSet }),
    [recipesWithLastCooked, selectedCategory, searchQuery, ownershipFilter, userId, myLikedSet],
  );

  const myDisplayName = displayNamesMap.get(userId)?.display_name || '';

  const setMyDisplayName = useCallback(async (name) => {
    if (!userId) throw new Error('要登入才能設定暱稱');
    const trimmed = name.trim();
    const updated = await db.updateDisplayName(userId, trimmed || null);
    setDisplayNameRows((prev) => {
      const exists = prev.some((r) => r.user_id === updated.user_id);
      return exists ? prev.map((r) => (r.user_id === updated.user_id ? updated : r)) : [...prev, updated];
    });
    return updated;
  }, [userId]);

  const toggleLike = useCallback(async (recipeId) => {
    if (!userId) throw new Error('要登入才能按讚');
    const alreadyLiked = myLikedSet.has(recipeId);
    // Optimistic
    setLikes((prev) => alreadyLiked
      ? prev.filter((l) => !(l.user_id === userId && l.recipe_id === recipeId))
      : [...prev, { user_id: userId, recipe_id: recipeId }]);
    try {
      if (alreadyLiked) await db.unlikeRecipe(userId, recipeId);
      else await db.likeRecipe(userId, recipeId);
    } catch (e) {
      // Rollback
      setLikes((prev) => alreadyLiked
        ? [...prev, { user_id: userId, recipe_id: recipeId }]
        : prev.filter((l) => !(l.user_id === userId && l.recipe_id === recipeId)));
      throw e;
    }
  }, [userId, myLikedSet]);
  const selectedRecipe = useMemo(
    () => recipesWithLastCooked.find((r) => r.id === selectedRecipeId) || null,
    [recipesWithLastCooked, selectedRecipeId],
  );

  return {
    loaded, loadError, recipes: recipesWithLastCooked, cookRecords, cookRecordError,
    searchQuery, setSearchQuery,
    selectedCategory, setSelectedCategory,
    availableCategories, filteredRecipes,
    currentView, selectedRecipe,
    openRecipeDetail,
    addCookRecord, removeCookRecord, updateCookRecordNotes,
    saveRecipe,
    deleteRecipeById,
    ownershipFilter, toggleOwnership,
    likeCounts, myLikedSet, toggleLike, likerNamesByRecipe,
    myDisplayName, setMyDisplayName,
    isGuest,
  };
}
