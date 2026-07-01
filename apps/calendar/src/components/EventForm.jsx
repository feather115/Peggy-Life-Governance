// 新增 / 編輯事件的表單。event = null 為新增模式。
import React, { useState } from 'react';
import { fromDatetimeLocalValue, toDatetimeLocalValue } from '../utils.js';

const S = {
  view: { padding: '6px 18px 24px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  backBtn: { border: 'none', background: '#fff', color: '#4A6FA5', fontWeight: 900, fontSize: 14, padding: '8px 16px', borderRadius: 14, cursor: 'pointer', boxShadow: '0 4px 12px -8px rgba(0,0,0,.2)', outline: 'none' },
  title: { fontSize: 20, fontWeight: 900, color: '#233A5E', margin: 0 },
  card: { background: '#fff', borderRadius: 20, padding: 18, boxShadow: '0 10px 24px -18px rgba(74,111,165,.3)' },
  label: { display: 'block', fontSize: 13, fontWeight: 900, color: '#233A5E', marginBottom: 6, marginTop: 14 },
  checkboxRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, cursor: 'pointer' },
  input: { width: '100%', boxSizing: 'border-box', border: 'none', background: '#F5F7FA', borderRadius: 14, padding: '11px 14px', fontSize: 14, fontWeight: 700, color: '#233A5E', outline: 'none' },
  textarea: { width: '100%', boxSizing: 'border-box', border: 'none', background: '#F5F7FA', borderRadius: 14, padding: '11px 14px', fontSize: 14, fontWeight: 700, color: '#233A5E', outline: 'none', minHeight: 80, lineHeight: 1.6, fontFamily: 'inherit' },
  actions: { display: 'flex', gap: 10, marginTop: 24 },
  saveBtn: { flex: 1, border: 'none', background: '#4A6FA5', color: '#fff', borderRadius: 14, padding: '12px 14px', fontSize: 15, fontWeight: 900, cursor: 'pointer', outline: 'none' },
  cancelBtn: { border: 'none', background: '#E9EEF6', color: '#4A6FA5', borderRadius: 14, padding: '12px 18px', fontSize: 15, fontWeight: 900, cursor: 'pointer', outline: 'none' },
  errorBox: { background: '#FEE2E2', color: '#B91C1C', padding: '10px 12px', borderRadius: 12, fontSize: 13, fontWeight: 800, marginTop: 12 },
  deleteBtn: { width: '100%', border: 'none', borderRadius: 14, padding: '12px 14px', fontSize: 13, fontWeight: 900, cursor: 'pointer', outline: 'none' },
};

// 新增事件時預設開始時間：選定日期的早上 9 點
function defaultStartValue(dateKey) {
  const d = dateKey ? new Date(dateKey) : new Date();
  d.setHours(9, 0, 0, 0);
  return toDatetimeLocalValue(d.toISOString());
}

export default function EventForm({ event, defaultDateKey, onSave, onDelete, onCancel }) {
  const isEdit = !!event;

  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [allDay, setAllDay] = useState(!!event?.all_day);
  const [startValue, setStartValue] = useState(
    event ? toDatetimeLocalValue(event.start_at) : defaultStartValue(defaultDateKey),
  );
  const [endValue, setEndValue] = useState(event?.end_at ? toDatetimeLocalValue(event.end_at) : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = async () => {
    setError('');
    if (!title.trim()) { setError('請輸入事件標題'); return; }
    if (!startValue) { setError('請選擇開始時間'); return; }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      all_day: allDay,
      start_at: fromDatetimeLocalValue(startValue),
      end_at: !allDay && endValue ? fromDatetimeLocalValue(endValue) : null,
    };

    setBusy(true);
    try {
      await onSave(payload, event?.id);
    } catch (e) {
      setError(e.message || '儲存失敗');
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setBusy(true);
    try {
      await onDelete(event.id);
    } catch (e) {
      setError(e.message || '刪除失敗');
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div style={S.view}>
      <header style={S.header}>
        <button type="button" onClick={onCancel} disabled={busy} style={S.backBtn}>‹ 取消</button>
        <h1 style={S.title}>{isEdit ? '編輯事件' : '新增事件'}</h1>
        <div style={{ width: 64 }} />
      </header>

      <div style={S.card}>
        <label style={{ ...S.label, marginTop: 0 }}>標題 *</label>
        <input style={S.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例：跟牙醫預約" />

        <label style={S.checkboxRow}>
          <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} /> 全天事件
        </label>

        <label style={S.label}>開始時間 *</label>
        <input
          type={allDay ? 'date' : 'datetime-local'}
          style={S.input}
          value={allDay ? startValue.slice(0, 10) : startValue}
          onChange={(e) => setStartValue(allDay ? `${e.target.value}T00:00` : e.target.value)}
        />

        {!allDay && (
          <>
            <label style={S.label}>結束時間（選填）</label>
            <input type="datetime-local" style={S.input} value={endValue} onChange={(e) => setEndValue(e.target.value)} />
          </>
        )}

        <label style={S.label}>備註（選填）</label>
        <textarea style={S.textarea} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="地點、細節..." />

        {error && <div style={S.errorBox}>{error}</div>}

        <div style={S.actions}>
          <button type="button" style={S.saveBtn} onClick={handleSave} disabled={busy}>
            {busy ? '儲存中…' : (isEdit ? '儲存變更' : '建立事件')}
          </button>
          <button type="button" style={S.cancelBtn} onClick={onCancel} disabled={busy}>取消</button>
        </div>

        {isEdit && onDelete && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #EEF1F6' }}>
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              style={{ ...S.deleteBtn, background: confirmDelete ? '#FEE2E2' : '#F5F7FA', color: confirmDelete ? '#B91C1C' : '#8792A6' }}
            >
              {confirmDelete ? '⚠️ 確認刪除（無法復原，再按一次）' : '🗑️ 刪除這個事件'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
