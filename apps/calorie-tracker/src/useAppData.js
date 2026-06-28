// ============================================================
//  useAppData — 唯一的狀態中樞
//  所有「資料 + 改資料的動作」都從這個 hook 出來。
//  元件不直接呼叫 db.js，一律透過這裡回傳的 action。
//
//  回傳：
//    狀態   loaded, loadError, days, customFoods, 四個 goal*, 兩組 tagDefs
//    setter setGoalCal/P/C/F（會自動 debounce 存回 Supabase）
//    動作   toggleTag, saveDayNote, addMeal, removeMeal,
//           addCustomFood, removeCustomFood, updateCustomFood, importFoods,
//           addTagDef, deleteTagDef, clearAll
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase.js';
import * as db from './db.js';
import { emptyDay } from './utils.js';

export function useAppData(userId) {
  const [days, setDays] = useState({});
  const [customFoods, setCustomFoods] = useState([]);
  const [displayName, setDisplayName] = useState('');
  const [goalCal, setGoalCal] = useState(1500);
  const [goalP, setGoalP] = useState(110);
  const [goalC, setGoalC] = useState(150);
  const [goalF, setGoalF] = useState(50);
  const [fastingTagDefs, setFastingTagDefs] = useState([]);
  const [otherTagDefs, setOtherTagDefs] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [challenges, setChallenges] = useState([]);
  const [foodUsage, setFoodUsage] = useState({}); // { [foodRef]: last_used_at } — 食物庫排序用

  // ── 初次載入（登入後或換使用者時）────────────────────────
  useEffect(() => {
    let cancel = false;
    setLoaded(false);
    // 挑戰表載入失敗不致命（schema 可能還沒建立），其它資料正常顯示
    Promise.all([
      db.loadAll(userId),
      db.loadMyChallenges(userId).catch((e) => { console.warn('Challenges unavailable:', e.message); return []; }),
    ])
      .then(([data, chList]) => {
        if (cancel) return;
        setDisplayName(data.displayName || '');
        setGoalCal(data.goalCal); setGoalP(data.goalP); setGoalC(data.goalC); setGoalF(data.goalF);
        setFastingTagDefs(data.fastingTagDefs); setOtherTagDefs(data.otherTagDefs);
        setCustomFoods(data.customFoods); setDays(data.days);
        setFoodUsage(data.foodUsage || {});
        setChallenges(chList || []);
        setLoaded(true);
      })
      .catch((e) => { setLoadError(e.message || '載入失敗'); setLoaded(true); });
    return () => { cancel = true; };
  }, [userId]);

  // 重新載入所有挑戰資料（建立、加入、結束、登記後呼叫）
  const reloadChallenges = useCallback(async () => {
    const list = await db.loadMyChallenges(userId);
    setChallenges(list || []);
  }, [userId]);

  // ── 目標變更：debounce 0.5 秒後存回（避免每次按鍵都打 API）──
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      db.saveSettings(userId, { goalCal, goalP, goalC, goalF, displayName }).catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [goalCal, goalP, goalC, goalF, displayName, loaded, userId]);

  // ── 標籤切換（某天啟用/取消一個標籤）────────────────────
  const toggleTag = useCallback(async (date, tagId, makeActive) => {
    const recordId = await db.toggleDayTag(userId, date, tagId, makeActive);
    setDays((prev) => {
      const day = prev[date] ? { ...prev[date] } : emptyDay();
      day.recordId = recordId;
      const cur = day.tags?.activeTags || [];
      day.tags = { activeTags: makeActive ? [...cur, tagId] : cur.filter((t) => t !== tagId) };
      return { ...prev, [date]: day };
    });
  }, [userId]);

  // ── 當日 AI 摘要 ──────────────────────────────────────
  const saveDayNote = useCallback(async (date, note) => {
    const recordId = await db.saveDayNote(userId, date, note);
    setDays((prev) => {
      const day = prev[date] ? { ...prev[date] } : emptyDay();
      return { ...prev, [date]: { ...day, recordId, dayNote: note } };
    });
  }, [userId]);

  // 記錄某個食物剛被選用/新增/編輯，食物庫排序用（最近用過的排最上面）
  const touchFood = useCallback((foodRef) => {
    if (!foodRef) return;
    const now = new Date().toISOString();
    setFoodUsage((prev) => ({ ...prev, [foodRef]: now }));
    db.touchFoodUsage(userId, foodRef).catch(() => {});
  }, [userId]);

  // ── 加入一筆餐點（snapshot 由呼叫端組好）─────────────────
  const addMeal = useCallback(async (date, mealKey, snapshot) => {
    const { recordId, item } = await db.addMealItem(userId, date, mealKey, snapshot);
    setDays((prev) => {
      const day = prev[date] ? { ...prev[date] } : emptyDay();
      const meals = { ...day.meals, [mealKey]: [...(day.meals[mealKey] || []), item] };
      return { ...prev, [date]: { ...day, recordId, meals } };
    });
    touchFood(snapshot.foodRef);
  }, [userId, touchFood]);

  // ── 刪除一筆餐點 ──────────────────────────────────────
  const removeMeal = useCallback(async (date, mealKey, itemId) => {
    await db.removeMealItem(itemId);
    setDays((prev) => {
      const day = prev[date];
      if (!day) return prev;
      return { ...prev, [date]: { ...day, meals: { ...day.meals, [mealKey]: day.meals[mealKey].filter((i) => i.id !== itemId) } } };
    });
  }, [userId]);

  // ── 編輯已加入的餐點（名稱/品牌/份量/卡路里/營養素）────────
  const editMeal = useCallback(async (date, mealKey, itemId, patch) => {
    const updated = await db.updateMealItem(itemId, patch);
    setDays((prev) => {
      const day = prev[date];
      if (!day) return prev;
      const items = day.meals[mealKey].map((i) => (i.id === itemId ? updated : i));
      return { ...prev, [date]: { ...day, meals: { ...day.meals, [mealKey]: items } } };
    });
  }, [userId]);

  // ── 自訂食物 ──────────────────────────────────────────
  const addCustomFood = useCallback(async (food) => {
    const nf = await db.addCustomFood(userId, food);
    setCustomFoods((prev) => [...prev, nf]);
    touchFood(nf.id);
    return nf;
  }, [userId, touchFood]);

  const removeCustomFood = useCallback(async (id) => {
    await db.deleteCustomFood(id);
    setCustomFoods((prev) => prev.filter((f) => f.id !== id));
  }, [userId]);

  // 改自訂食物定義；已經記錄過的歷史餐點是快照，不會被這個動作動到
  const updateCustomFood = useCallback(async (id, food) => {
    const nf = await db.updateCustomFood(id, food);
    setCustomFoods((prev) => prev.map((f) => (f.id === id ? nf : f)));
    touchFood(id);
    return nf;
  }, [userId, touchFood]);

  // 一次匯入多筆（JSON 匯入用），回傳成功筆數
  const importFoods = useCallback(async (list) => {
    const added = [];
    for (const v of list) added.push(await db.addCustomFood(userId, v));
    setCustomFoods((prev) => [...prev, ...added]);
    return added.length;
  }, [userId]);

  // ── 標籤定義（設定頁的新增/刪除）─────────────────────────
  const addTagDef = useCallback(async (type, label, color) => {
    const list = type === 'fasting' ? fastingTagDefs : otherTagDefs;
    if (list.some((t) => t.label === label)) return false; // 重複名稱不加
    const newTag = await db.addTagDef(userId, type, label, list.length, color);
    if (type === 'fasting') setFastingTagDefs((prev) => [...prev, newTag]);
    else setOtherTagDefs((prev) => [...prev, newTag]);
    return true;
  }, [userId, fastingTagDefs, otherTagDefs]);

  const updateTagColor = useCallback(async (type, id, color) => {
    const updated = await db.updateTagDefColor(id, color);
    const apply = (prev) => prev.map((t) => (t.id === id ? { ...t, color: updated.color } : t));
    if (type === 'fasting') setFastingTagDefs(apply);
    else setOtherTagDefs(apply);
  }, []);

  // 刪除標籤定義：資料庫靠 ON DELETE CASCADE 清掉 day_tags，
  // 這裡再同步清掉前端 days 裡殘留的 id（避免畫面殘影）
  const deleteTagDef = useCallback(async (type, id) => {
    await db.deleteTagDef(id);
    if (type === 'fasting') setFastingTagDefs((prev) => prev.filter((t) => t.id !== id));
    else setOtherTagDefs((prev) => prev.filter((t) => t.id !== id));
    setDays((prev) => {
      const next = {};
      for (const k of Object.keys(prev)) {
        const d = prev[k];
        const tags = d.tags?.activeTags || [];
        next[k] = tags.includes(id) ? { ...d, tags: { activeTags: tags.filter((t) => t !== id) } } : d;
      }
      return next;
    });
  }, [userId]);

  // ── 清除全部資料（保留標籤定義與目標）──────────────────
  const clearAll = useCallback(async () => {
    const ids = Object.values(days).map((d) => d.recordId).filter(Boolean);
    if (ids.length) await supabase.from('day_records').delete().in('id', ids);
    const cfIds = customFoods.map((f) => f.id);
    if (cfIds.length) await supabase.from('custom_foods').delete().in('id', cfIds);
    setDays({});
    setCustomFoods([]);
  }, [days, customFoods]);

  // ── Weight Challenge actions ────────────────────────────────
  const createChallenge = useCallback(async (payload) => {
    await db.createChallenge(userId, payload);
    await reloadChallenges();
  }, [userId, reloadChallenges]);

  const joinChallenge = useCallback(async (code) => {
    await db.joinChallengeByCode(userId, code);
    await reloadChallenges();
  }, [userId, reloadChallenges]);

  const leaveChallenge = useCallback(async (challengeId) => {
    await db.leaveChallenge(userId, challengeId);
    await reloadChallenges();
  }, [userId, reloadChallenges]);

  const updateChallenge = useCallback(async (challengeId, patch) => {
    await db.updateChallenge(challengeId, patch);
    await reloadChallenges();
  }, [reloadChallenges]);

  const endChallenge = useCallback(async (challengeId, winnerUserId) => {
    await db.endChallenge(challengeId, winnerUserId);
    await reloadChallenges();
  }, [reloadChallenges]);

  const deleteChallenge = useCallback(async (challengeId) => {
    await db.deleteChallenge(challengeId);
    await reloadChallenges();
  }, [reloadChallenges]);

  const submitWeightEntry = useCallback(async (payload) => {
    await db.upsertWeightEntry(userId, payload);
    await reloadChallenges();
  }, [userId, reloadChallenges]);

  const removeWeightEntry = useCallback(async (entryId) => {
    await db.deleteWeightEntry(entryId);
    await reloadChallenges();
  }, [reloadChallenges]);

  const setMemberColor = useCallback(async (challengeId, colorHex) => {
    await db.setMemberColor(userId, challengeId, colorHex);
    await reloadChallenges();
  }, [userId, reloadChallenges]);

  return {
    loaded, loadError,
    days, customFoods, foodUsage,
    displayName, setDisplayName,
    goalCal, goalP, goalC, goalF,
    setGoalCal, setGoalP, setGoalC, setGoalF,
    challenges,
    createChallenge, joinChallenge, leaveChallenge, updateChallenge, endChallenge, deleteChallenge,
    submitWeightEntry, removeWeightEntry, setMemberColor,
    userId,
    fastingTagDefs, otherTagDefs,
    toggleTag, saveDayNote, addMeal, removeMeal, editMeal,
    addCustomFood, removeCustomFood, updateCustomFood, importFoods,
    addTagDef, updateTagColor, deleteTagDef, clearAll,
  };
}
