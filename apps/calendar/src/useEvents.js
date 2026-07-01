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

  // 檢視模式（月/週/日）+ 目前聚焦的日期
  const [view, setView] = useState('month');
  const [anchorKey, setAnchorKey] = useState(todayKey());

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

  const goToday = useCallback(() => setAnchorKey(todayKey()), []);

  return {
    loaded, loadError, events, eventsByDate,
    view, setView,
    anchorKey, setAnchorKey, goToday,
    createEvent, updateEvent, deleteEvent,
  };
}
