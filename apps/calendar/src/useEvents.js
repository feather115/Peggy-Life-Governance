// ============================================================
//  useEvents — 事件的狀態中樞
//  載入事件、月/週/日檢視切換、新增/編輯/刪除全部從這裡出來。
//  元件不直接呼叫 db.js，一律透過這個 hook 回傳的 state/action。
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import * as db from './db.js';
import { groupEventsByDate, todayKey } from './utils.js';

export function useEvents(userId) {
  const [events, setEvents] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');

  // 檢視模式（月/週/日）——預設開日檢視，開啟 app 直接看「今天要幹嘛」比看整個月曆有用
  const [view, setView] = useState('day');
  // anchorKey：目前檢視「翻頁翻到哪」（月檢視=哪個月、週檢視=哪一週、日檢視=哪一天）
  const [anchorKey, setAnchorKey] = useState(todayKey());
  // selectedDateKey：目前「選中/聚焦」的單一天——月檢視點日期只會改這個（不會離開月檢視），
  // 下方的當日摘要卡跟著這個走；日檢視顯示的也是這一天。兩者分開才能做到「翻月曆不會失去選中的那天」。
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey());

  useEffect(() => {
    let cancel = false;
    db.loadEvents(userId)
      .then((rows) => { if (!cancel) { setEvents(rows); setLoaded(true); } })
      .catch((e) => {
        if (cancel) return;
        console.error('事件載入失敗：', e.message);
        setLoadError(e.message || '載入失敗');
        setLoaded(true);
      });
    return () => { cancel = true; };
  }, [userId]);

  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);

  const createEvent = useCallback(async (payload) => {
    const created = await db.createEvent(userId, payload);
    setEvents((prev) => [...prev, created]);
    return created;
  }, [userId]);

  const updateEvent = useCallback(async (eventId, patch) => {
    const updated = await db.updateEvent(eventId, patch);
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    return updated;
  }, []);

  const deleteEvent = useCallback(async (eventId) => {
    await db.deleteEvent(eventId);
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  }, []);

  // 選項庫改名時同步改寫過去事件的欄位值（field: 'location' | 'people' | 'tags'）
  const renameFieldValue = useCallback(async (field, oldName, newName) => {
    const affected = events.filter((ev) => (field === 'location' ? ev.location === oldName : (ev[field] || []).includes(oldName)));
    if (affected.length === 0) return;
    const updated = await Promise.all(affected.map((ev) => {
      const patch = field === 'location'
        ? { location: newName }
        : { [field]: [...new Set(ev[field].map((v) => (v === oldName ? newName : v)))] };
      return db.updateEvent(ev.id, patch);
    }));
    setEvents((prev) => prev.map((e) => updated.find((u) => u.id === e.id) || e));
  }, [events]);

  const goToday = useCallback(() => {
    const t = todayKey();
    setAnchorKey(t);
    setSelectedDateKey(t);
  }, []);

  // 開啟日檢視聚焦到某一天（月/週檢視點下去都會走這條）：翻頁錨點跟選中日期一起對齊，並切到日檢視。
  const openDay = useCallback((dateKey) => {
    setAnchorKey(dateKey);
    setSelectedDateKey(dateKey);
    setView('day');
  }, []);

  return {
    loaded, loadError, events, eventsByDate,
    view, setView,
    anchorKey, setAnchorKey,
    selectedDateKey, setSelectedDateKey,
    goToday, openDay,
    createEvent, updateEvent, deleteEvent, renameFieldValue,
  };
}
