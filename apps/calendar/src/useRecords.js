// ============================================================
//  useRecords — 紀錄的狀態中樞（事件與日記合併後的單一實體）
//  一筆「紀錄」有計畫面（title/color/description/選項庫 tags）與回顧面
//  （note/分類 diary_tags/tag_details/hashtags），過期的計畫補上回顧就成了日記。
//  載入紀錄、月/週/日檢視切換、新增/編輯/刪除全部從這裡出來。
//  元件不直接呼叫 db.js，一律透過這個 hook 回傳的 state/action。
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import * as db from './db.js';
import { groupRecordsByDate, todayKey } from './utils.js';

export function useRecords(userId) {
  const [records, setRecords] = useState([]);
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
    db.loadRecords(userId)
      .then((rows) => { if (!cancel) { setRecords(rows); setLoaded(true); } })
      .catch((e) => {
        if (cancel) return;
        console.error('紀錄載入失敗：', e.message);
        setLoadError(e.message || '載入失敗');
        setLoaded(true);
      });
    return () => { cancel = true; };
  }, [userId]);

  const recordsByDate = useMemo(() => groupRecordsByDate(records), [records]);

  // 分類標籤 → 過去填過的細節文字（去重、最近的排前面），給 RecordForm 的細節輸入框做自動建議用
  const tagDetailHistory = useMemo(() => {
    const sorted = records.slice().sort((a, b) => new Date(b.start_at) - new Date(a.start_at));
    const map = new Map();
    sorted.forEach((r) => {
      Object.entries(r.tag_details || {}).forEach(([tag, detail]) => {
        if (!detail) return;
        if (!map.has(tag)) map.set(tag, []);
        const arr = map.get(tag);
        if (!arr.includes(detail)) arr.push(detail);
      });
    });
    return map;
  }, [records]);

  const createRecord = useCallback(async (payload) => {
    const created = await db.createRecord(userId, payload);
    setRecords((prev) => [...prev, created]);
    return created;
  }, [userId]);

  const updateRecord = useCallback(async (recordId, patch) => {
    const updated = await db.updateRecord(recordId, patch);
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    return updated;
  }, []);

  const deleteRecord = useCallback(async (recordId) => {
    await db.deleteRecord(recordId);
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
  }, []);

  // 選項庫改名時同步改寫過去紀錄的欄位值（field: 'locations' | 'people' | 'tags'，都是 text[]）
  const renameFieldValue = useCallback(async (field, oldName, newName) => {
    const affected = records.filter((r) => (r[field] || []).includes(oldName));
    if (affected.length === 0) return;
    const updated = await Promise.all(affected.map((r) => {
      const patch = { [field]: [...new Set(r[field].map((v) => (v === oldName ? newName : v)))] };
      return db.updateRecord(r.id, patch);
    }));
    setRecords((prev) => prev.map((r) => updated.find((u) => u.id === r.id) || r));
  }, [records]);

  // ---- 給 useDiaryTags 的分類標籤管理同步用（分類標籤存在紀錄的 diary_tags / tag_details）----

  // 分類標籤改名：同步所有引用它的紀錄，diary_tags 陣列裡的字串、tag_details 的 key 兩邊都要改
  const renameDiaryTagEverywhere = useCallback(async (oldTag, newTag) => {
    const affected = records.filter((r) => (r.diary_tags || []).includes(oldTag));
    if (affected.length === 0) return;
    const updated = await Promise.all(affected.map((r) => {
      const nextTags = r.diary_tags.map((t) => (t === oldTag ? newTag : t));
      const nextDetails = { ...(r.tag_details || {}) };
      if (oldTag in nextDetails) {
        nextDetails[newTag] = nextDetails[oldTag];
        delete nextDetails[oldTag];
      }
      return db.updateRecord(r.id, { diary_tags: nextTags, tag_details: nextDetails });
    }));
    setRecords((prev) => prev.map((r) => updated.find((u) => u.id === r.id) || r));
  }, [records]);

  // 分類標籤（含子標籤）被刪掉時，從紀錄的 diary_tags 拿掉（比照原本行為：只更新本地 state）
  const removeDiaryTagsEverywhere = useCallback((tagSet) => {
    if (!tagSet || tagSet.size === 0) return;
    setRecords((prev) => prev.map((r) => ({ ...r, diary_tags: (r.diary_tags || []).filter((t) => !tagSet.has(t)) })));
  }, []);

  const renameTagDetailEverywhere = useCallback(async (tag, oldDetail, newDetail) => {
    const affected = records.filter((r) => r.tag_details?.[tag] === oldDetail);
    if (affected.length === 0) return;
    const updated = await Promise.all(affected.map((r) => db.updateRecord(r.id, {
      tag_details: { ...r.tag_details, [tag]: newDetail },
    })));
    setRecords((prev) => prev.map((r) => updated.find((u) => u.id === r.id) || r));
  }, [records]);

  const removeTagDetailEverywhere = useCallback(async (tag, detail) => {
    const affected = records.filter((r) => r.tag_details?.[tag] === detail);
    if (affected.length === 0) return;
    const updated = await Promise.all(affected.map((r) => {
      const nextDetails = { ...r.tag_details };
      delete nextDetails[tag];
      return db.updateRecord(r.id, { tag_details: nextDetails });
    }));
    setRecords((prev) => prev.map((r) => updated.find((u) => u.id === r.id) || r));
  }, [records]);

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
    loaded, loadError, records, recordsByDate, tagDetailHistory,
    view, setView,
    anchorKey, setAnchorKey,
    selectedDateKey, setSelectedDateKey,
    goToday, openDay,
    createRecord, updateRecord, deleteRecord, renameFieldValue,
    renameDiaryTagEverywhere, removeDiaryTagsEverywhere,
    renameTagDetailEverywhere, removeTagDetailEverywhere,
  };
}
