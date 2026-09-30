// 任務「標記完成」的行內確認列：選完成日期（預設今天）→ 確認完成。
// 任務列表（TasksView）與月/週/日時間軸（TimelineItems）共用，不用跳頁就能勾掉任務。
import React, { useState } from 'react';
import { THEME } from '../theme.js';
import { todayKey } from '../utils.js';

const S = {
  row: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 },
  dateInput: { flex: 1, minWidth: 0, boxSizing: 'border-box', padding: '10px', borderRadius: THEME.radiusSmInner, border: `1px solid ${THEME.border}`, fontSize: 14, color: THEME.textDark, background: THEME.surface },
  confirmBtn: { border: 'none', padding: '11px 14px', borderRadius: THEME.radiusSmInner, background: THEME.primary, color: '#fff', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' },
  cancelBtn: { border: 'none', background: 'none', padding: '11px 6px', fontSize: 14, color: THEME.textMuted, whiteSpace: 'nowrap' },
  error: { marginTop: 6, fontSize: 13, color: THEME.errorInk },
};

export default function TaskCompleteRow({ onConfirm, onCancel }) {
  const [date, setDate] = useState(todayKey());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      await onConfirm(date);
    } catch (e) {
      setError(e.message || '標記失敗');
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={S.row}>
        <input aria-label="完成日期" type="date" style={S.dateInput} value={date} onChange={(e) => setDate(e.target.value)} />
        <button type="button" style={S.confirmBtn} onClick={confirm} disabled={busy || !date}>{busy ? '處理中…' : '確認完成'}</button>
        <button type="button" style={S.cancelBtn} onClick={onCancel} disabled={busy}>取消</button>
      </div>
      {error && <div style={S.error}>{error}</div>}
    </div>
  );
}
