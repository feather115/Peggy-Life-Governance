// ============================================================
//  useTasks — 週期性任務的狀態中樞
//  載入任務、新增/編輯/刪除、標記完成（自動算下次到期日）全部從這裡出來。
//  元件不直接呼叫 db.js，一律透過這個 hook 回傳的 state/action。
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import * as db from './db.js';
import { addInterval, todayKey } from './utils.js';

export function useTasks(userId) {
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancel = false;
    db.loadTasks(userId)
      .then((rows) => { if (!cancel) { setTasks(rows); setLoaded(true); } })
      .catch((e) => {
        if (cancel) return;
        console.error('任務載入失敗：', e.message);
        setLoadError(e.message || '載入失敗');
        setLoaded(true);
      });
    return () => { cancel = true; };
  }, [userId]);

  // 依 next_due 分組（只有 show_on_calendar 才會出現在月/週/日檢視上）
  const tasksByDueDate = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      if (t.show_on_calendar === false) return;
      if (!map[t.next_due]) map[t.next_due] = [];
      map[t.next_due].push(t);
    });
    return map;
  }, [tasks]);

  const createTask = useCallback(async (payload) => {
    const created = await db.createTask(userId, payload);
    setTasks((prev) => [...prev, created]);
    return created;
  }, [userId]);

  const updateTask = useCallback(async (taskId, patch) => {
    const updated = await db.updateTask(taskId, patch);
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    return updated;
  }, []);

  const deleteTask = useCallback(async (taskId) => {
    await db.deleteTask(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  // 標記某個任務在 doneDate 完成：算出下次到期日、記錄完成歷史
  const confirmComplete = useCallback(async (taskId, doneDate) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const nextDue = addInterval(doneDate, task.interval_value, task.interval_unit);
    const history = [...(task.history || []), doneDate];
    const updated = await db.updateTask(taskId, { last_done: doneDate, next_due: nextDue, history });
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    return updated;
  }, [tasks]);

  return {
    loaded, loadError, tasks, tasksByDueDate,
    createTask, updateTask, deleteTask, confirmComplete,
    today: todayKey(),
  };
}
