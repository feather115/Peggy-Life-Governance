// ============================================================
//  useRecipes — 食譜清單的狀態中樞
//  載入 recipes、搜尋/分類篩選、瀏覽 detail 的網址同步全部從這裡出來。
//  元件不直接呼叫 db.js，一律透過這個 hook 回傳的 state/action。
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import * as db from './db.js';
import {
  ALL_CATEGORY,
  filterRecipes,
  getAvailableCategories,
} from './utils.js';

function getRecipeIdFromUrl() {
  const url = new URL(window.location.href);
  return url.searchParams.get('recipe');
}

function buildDetailUrl(recipeId) {
  const url = new URL(window.location.href);
  url.searchParams.set('recipe', recipeId);
  return url.toString();
}

function buildHomeUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete('recipe');
  return url.toString();
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'instant' });
}

export function useRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');

  // 搜尋 / 分類
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);

  // 導覽（catalog ↔ detail）
  const [currentView, setCurrentView] = useState('home');
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);

  // 初次載入
  useEffect(() => {
    let cancel = false;
    db.loadRecipes()
      .then((rows) => {
        if (cancel) return;
        setRecipes(rows);
        setLoaded(true);
      })
      .catch((e) => {
        if (cancel) return;
        console.error('雲端數據調度失敗：', e.message);
        setLoadError(e.message || '載入失敗');
        setLoaded(true);
      });
    return () => { cancel = true; };
  }, []);

  // 載入完成後，根據 URL 同步 view（支援直接開帶 ?recipe=xxx 的網址）
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
      window.history.replaceState({ view: 'home' }, '', buildHomeUrl());
      setCurrentView('home');
      setSelectedRecipeId(null);
    }
  }

  const openRecipeDetail = useCallback((recipe) => {
    setSelectedRecipeId(recipe.id);
    setCurrentView('detail');
    scrollToTop();
    window.history.pushState({ view: 'detail', recipeId: recipe.id }, '', buildDetailUrl(recipe.id));
  }, []);

  const availableCategories = useMemo(() => getAvailableCategories(recipes), [recipes]);
  const filteredRecipes = useMemo(
    () => filterRecipes(recipes, selectedCategory, searchQuery),
    [recipes, selectedCategory, searchQuery],
  );
  const selectedRecipe = useMemo(
    () => recipes.find((r) => r.id === selectedRecipeId) || null,
    [recipes, selectedRecipeId],
  );

  return {
    loaded, loadError, recipes,
    searchQuery, setSearchQuery,
    selectedCategory, setSelectedCategory,
    availableCategories, filteredRecipes,
    currentView, selectedRecipe,
    openRecipeDetail,
  };
}
