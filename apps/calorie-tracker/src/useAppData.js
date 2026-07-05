// ============================================================
//  useAppData — The sole state hub
//  All data and modification actions come from this hook.
//  Components do not call db.js directly, but use the actions returned here.
//
//  Returns:
//    state   loaded, loadError, days, customFoods, foodUsage, displayName,
//            four goal*, two tagDefs sets, challenges
//    setter  setGoalCal/P/C/F, setDisplayName (automatically debounced and saved to Supabase)
//    action  toggleTag, saveDayNote, addMeal, removeMeal, editMeal,
//            addCustomFood, removeCustomFood, updateCustomFood, importFoods,
//            addTagDef, updateTagColor, deleteTagDef, clearAll,
//            createChallenge, joinChallenge, leaveChallenge, updateChallenge,
//            endChallenge, deleteChallenge, submitWeightEntry, removeWeightEntry, setMemberColor
//  Internal: touchFood (called by addMeal/addCustomFood/updateCustomFood to keep food_usage sorting fresh)
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
  const [foodUsage, setFoodUsage] = useState({}); // { [foodRef]: last_used_at } — Used for sorting the food library

  // ── Initial load (after login or switching user) ────────────────────────
  useEffect(() => {
    let cancel = false;
    setLoaded(false);
    // Failure to load challenges is non-fatal (schema might not be created yet); other data will display normally.
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

  // Reloads all challenge data (called after creating, joining, ending, or recording weight)
  const reloadChallenges = useCallback(async () => {
    const list = await db.loadMyChallenges(userId);
    setChallenges(list || []);
  }, [userId]);

  // ── Goal changes: debounced for 0.5 seconds before saving (to avoid calling APIs on every keystroke) ──
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      db.saveSettings(userId, { goalCal, goalP, goalC, goalF, displayName }).catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [goalCal, goalP, goalC, goalF, displayName, loaded, userId]);

  // ── Tag toggle (enable/disable a tag for a specific day) ────────────────────
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

  // ── Daily AI Summary ──────────────────────────────────────
  const saveDayNote = useCallback(async (date, note) => {
    const recordId = await db.saveDayNote(userId, date, note);
    setDays((prev) => {
      const day = prev[date] ? { ...prev[date] } : emptyDay();
      return { ...prev, [date]: { ...day, recordId, dayNote: note } };
    });
  }, [userId]);

  // Logs when a food was selected/added/edited, used for food library sorting (recently used first)
  const touchFood = useCallback((foodRef) => {
    if (!foodRef) return;
    const now = new Date().toISOString();
    setFoodUsage((prev) => ({ ...prev, [foodRef]: now }));
    db.touchFoodUsage(userId, foodRef).catch(() => {});
  }, [userId]);

  // ── Add a meal item (snapshot compiled by the caller) ─────────────────
  const addMeal = useCallback(async (date, mealKey, snapshot) => {
    const { recordId, item } = await db.addMealItem(userId, date, mealKey, snapshot);
    setDays((prev) => {
      const day = prev[date] ? { ...prev[date] } : emptyDay();
      const meals = { ...day.meals, [mealKey]: [...(day.meals[mealKey] || []), item] };
      return { ...prev, [date]: { ...day, recordId, meals } };
    });
    touchFood(snapshot.foodRef);
  }, [userId, touchFood]);

  // ── Delete a meal item ──────────────────────────────────────
  const removeMeal = useCallback(async (date, mealKey, itemId) => {
    await db.removeMealItem(itemId);
    setDays((prev) => {
      const day = prev[date];
      if (!day) return prev;
      return { ...prev, [date]: { ...day, meals: { ...day.meals, [mealKey]: day.meals[mealKey].filter((i) => i.id !== itemId) } } };
    });
  }, []);

  // ── Edit an already added meal item (name/brand/unit/calories/nutrients) ────────
  const editMeal = useCallback(async (date, mealKey, itemId, patch) => {
    const updated = await db.updateMealItem(itemId, patch);
    setDays((prev) => {
      const day = prev[date];
      if (!day) return prev;
      const items = day.meals[mealKey].map((i) => (i.id === itemId ? updated : i));
      return { ...prev, [date]: { ...day, meals: { ...day.meals, [mealKey]: items } } };
    });
  }, []);

  // ── Custom Foods ──────────────────────────────────────────
  const addCustomFood = useCallback(async (food) => {
    const nf = await db.addCustomFood(userId, food);
    setCustomFoods((prev) => [...prev, nf]);
    touchFood(nf.id);
    return nf;
  }, [userId, touchFood]);

  const removeCustomFood = useCallback(async (id) => {
    await db.deleteCustomFood(userId, id);
    setCustomFoods((prev) => prev.filter((f) => f.id !== id));
    setFoodUsage((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, [userId]);

  // Modify custom food definition; previously recorded meals are snapshots and are not affected by this action.
  const updateCustomFood = useCallback(async (id, food) => {
    const nf = await db.updateCustomFood(id, food);
    setCustomFoods((prev) => prev.map((f) => (f.id === id ? nf : f)));
    touchFood(id);
    return nf;
  }, [userId, touchFood]);

  // Bulk import (used for JSON import), returns the count of successfully imported items
  const importFoods = useCallback(async (list) => {
    const added = [];
    for (const v of list) added.push(await db.addCustomFood(userId, v));
    setCustomFoods((prev) => [...prev, ...added]);
    return added.length;
  }, [userId]);

  // ── Tag definitions (adding/deleting in Settings page) ─────────────────────────
  const addTagDef = useCallback(async (type, label, color) => {
    const list = type === 'fasting' ? fastingTagDefs : otherTagDefs;
    if (list.some((t) => t.label === label)) return false; // Do not add duplicate names
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

  // Delete tag definition: database uses ON DELETE CASCADE to clear day_tags,
  // here we synchronize and remove the remaining IDs in frontend days (to prevent UI ghosting)
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
  }, []);

  // ── Clear all data (retains tag definitions and goals) ──────────────────
  const clearAll = useCallback(async () => {
    const ids = Object.values(days).map((d) => d.recordId).filter(Boolean);
    if (ids.length) await supabase.from('day_records').delete().in('id', ids);
    const cfIds = customFoods.map((f) => f.id);
    if (cfIds.length) await supabase.from('custom_foods').delete().in('id', cfIds);
    // Sorting records go with the foods/meals — clear them too so food_usage doesn't keep orphan refs
    await supabase.from('food_usage').delete().eq('user_id', userId);
    setDays({});
    setCustomFoods([]);
    setFoodUsage({});
  }, [days, customFoods, userId]);

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
