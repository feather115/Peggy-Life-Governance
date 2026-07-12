// ============================================================
//  useOptions — 地點/人名/事件標籤選項庫（event_options）的狀態中樞
//  表單下拉選單的資料來源 + 設定頁「管理地點、人名與標籤」的維護 action。
//  跟其他 hook 不同：載入失敗不擋整個 app（選單退化成純文字輸入），
//  loadError 留給設定頁顯示（例如 migration 還沒跑）。
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import * as db from './db.js';

export function useOptions(userId) {
  const [options, setOptions] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancel = false;
    db.loadOptions(userId)
      .then((rows) => { if (!cancel) { setOptions(rows); setLoaded(true); } })
      .catch((e) => {
        if (cancel) return;
        console.warn('選項庫載入失敗（選單退化成純輸入）：', e.message);
        setLoadError(e.message || '載入失敗');
        setLoaded(true);
      });
    return () => { cancel = true; };
  }, [userId]);

  // 表單選單用：只列未封存的。地點/人名是字串陣列；標籤是 { value, label }
  // （子標籤 label 縮排、母標籤封存時整組不出現；不同母標籤下的同名子標籤只列一次）。
  const menus = useMemo(() => {
    const active = (kind) => options.filter((o) => o.kind === kind && !o.archived);
    const activeTags = active('tag');
    const tags = [];
    const seen = new Set();
    activeTags.filter((o) => !o.parent_id).forEach((top) => {
      if (!seen.has(top.name)) { seen.add(top.name); tags.push({ value: top.name, label: top.name }); }
      activeTags.filter((o) => o.parent_id === top.id).forEach((child) => {
        if (!seen.has(child.name)) { seen.add(child.name); tags.push({ value: child.name, label: `└ ${child.name}` }); }
      });
    });
    return {
      locations: active('location').map((o) => o.name),
      people: active('person').map((o) => o.name),
      tags,
    };
  }, [options]);

  // 存檔後把新出現的名字自動補進選項庫；再次使用封存名稱時自動恢復。
  // 失敗只警告不丟錯——表單儲存本身已經成功，不能因為補登失敗而擋住使用者。
  const ensureNames = useCallback(async (pairs) => {
    const missing = [];
    const archived = [];
    pairs.forEach(({ kind, names }) => {
      (names || []).forEach((raw) => {
        const name = (raw || '').trim();
        if (!name) return;
        const existing = options.find((o) => o.kind === kind && o.name === name);
        if (existing) {
          if (existing.archived && !archived.some((o) => o.id === existing.id)) archived.push(existing);
          return;
        }
        if (missing.some((m) => m.kind === kind && m.name === name)) return;
        missing.push({ kind, name });
      });
    });
    if (missing.length === 0 && archived.length === 0) return;
    try {
      const [created, restored] = await Promise.all([
        missing.length > 0 ? db.createOptions(userId, missing) : [],
        Promise.all(archived.map((o) => db.updateOption(o.id, { archived: false }))),
      ]);
      setOptions((prev) => [
        ...prev.map((o) => restored.find((item) => item.id === o.id) || o),
        ...created,
      ]);
    } catch (e) {
      console.warn('選項庫自動補登失敗：', e.message);
    }
  }, [userId, options]);

  const addOption = useCallback(async (kind, rawName, parentId = null) => {
    const name = (rawName || '').trim();
    if (!name) return;
    const dup = options.find((o) => o.kind === kind && o.name === name && (o.parent_id ?? null) === (parentId ?? null));
    if (dup) {
      // 同層同名已存在：封存中的就幫他恢復，其他情況不重複建立
      if (dup.archived) {
        const updated = await db.updateOption(dup.id, { archived: false });
        setOptions((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      }
      return;
    }
    const [created] = await db.createOptions(userId, [{ kind, name, parent_id: parentId }]);
    setOptions((prev) => [...prev, created]);
  }, [userId, options]);

  const setArchived = useCallback(async (optionId, archived) => {
    const updated = await db.updateOption(optionId, { archived });
    setOptions((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  }, []);

  const removeOption = useCallback(async (optionId) => {
    await db.deleteOption(optionId);
    // DB 端子標籤會 cascade 刪除，前端也一起拿掉
    setOptions((prev) => prev.filter((o) => o.id !== optionId && o.parent_id !== optionId));
  }, []);

  // 改名：同層已有同名 → 合併（子標籤搬到目標下，目標已有同名子標籤的直接消掉），否則單純改名。
  // 回傳 { kind, oldName, newName } 讓呼叫端同步改寫過去的事件/日記；沒改動回傳 null。
  const renameOption = useCallback(async (optionId, rawName) => {
    const opt = options.find((o) => o.id === optionId);
    const name = (rawName || '').trim();
    if (!opt || !name || name === opt.name) return null;
    const dup = options.find((o) => o.id !== optionId && o.kind === opt.kind && o.name === name && (o.parent_id ?? null) === (opt.parent_id ?? null));
    if (dup) {
      const children = options.filter((o) => o.parent_id === optionId);
      const dupChildNames = new Set(options.filter((o) => o.parent_id === dup.id).map((o) => o.name));
      const moved = await Promise.all(
        children.filter((c) => !dupChildNames.has(c.name)).map((c) => db.updateOption(c.id, { parent_id: dup.id })),
      );
      await db.deleteOption(optionId); // 同名子標籤還掛在底下，跟著 cascade 消掉
      const removedIds = new Set([optionId, ...children.filter((c) => dupChildNames.has(c.name)).map((c) => c.id)]);
      setOptions((prev) => prev
        .filter((o) => !removedIds.has(o.id))
        .map((o) => moved.find((m) => m.id === o.id) || o));
    } else {
      const updated = await db.updateOption(optionId, { name });
      setOptions((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    }
    return { kind: opt.kind, oldName: opt.name, newName: name };
  }, [options]);

  return { loaded, loadError, options, menus, ensureNames, addOption, renameOption, setArchived, removeOption };
}
