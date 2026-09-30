// 任務「標記完成」的行內確認列：選完成日期（預設今天）→ 確認完成。
// 任務列表（TasksView）與月/週/日時間軸（TimelineItems）共用，不用跳頁就能勾掉任務。
import React, { useState } from 'react';
import { UI } from '@peggy-life/shared/ui';
import { todayKey } from '../utils.js';

const S = {
  row: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 },
  dateInput: { ...UI.input, flex: 1, minWidth: 0, minHeight: 40 },
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
        <button type="button" style={{ ...UI.btnSecondary, opacity: busy || !date ? 0.6 : 1 }} onClick={confirm} disabled={busy || !date}>{busy ? '處理中…' : '確認完成'}</button>
        <button type="button" style={{ ...UI.btnText, color: 'var(--text-muted)' }} onClick={onCancel} disabled={busy}>取消</button>
      </div>
      {error && <div style={UI.fieldError}>{error}</div>}
    </div>
  );
}
