// 新增 / 編輯週期性任務。task = null 為新增模式。
import React, { useState } from 'react';
import { THEME } from '../theme.js';
import { todayKey } from '../utils.js';

const S = {
  header: { display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: THEME.surface, borderBottom: `1px solid ${THEME.border}` },
  backBtn: { border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: THEME.textMuted, padding: '2px 6px', outline: 'none' },
  title: { fontSize: 17, fontWeight: 700, color: THEME.textDark },
  body: { padding: 20, display: 'flex', flexDirection: 'column', gap: 18 },
  fieldLabel: { fontSize: 13, color: THEME.textMuted, marginBottom: 6 },
  required: { color: THEME.error },
  input: { width: '100%', boxSizing: 'border-box', border: `1px solid ${THEME.border}`, borderRadius: THEME.radiusSm, padding: '11px 12px', fontSize: 15, color: THEME.textDark, background: THEME.surface, outline: 'none' },
  inputError: { borderColor: THEME.error },
  errorText: { fontSize: 12, color: THEME.error, marginTop: 5 },
  intervalRow: { display: 'flex', gap: 8, alignItems: 'center' },
  intervalInput: { width: 70, boxSizing: 'border-box', border: `1px solid ${THEME.border}`, borderRadius: THEME.radiusSm, padding: '11px 12px', fontSize: 15, color: THEME.textDark, background: THEME.surface, outline: 'none' },
  unitSegment: { flex: 1, display: 'flex', background: THEME.surfaceAlt, borderRadius: THEME.radiusSm, padding: 3, gap: 2 },
  unitBtn: (active) => ({ flex: 1, border: 'none', cursor: 'pointer', padding: '9px 0', borderRadius: THEME.radiusSmInner, fontSize: 13, fontWeight: 600, background: active ? THEME.primary : 'transparent', color: active ? '#fff' : THEME.textMuted, outline: 'none' }),
  toggleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  toggleTextWrap: {},
  toggleTitle: { fontSize: 14, color: THEME.textDark, fontWeight: 600 },
  toggleHint: { fontSize: 12, color: THEME.textMuted, marginTop: 2 },
  toggleTrack: (on) => ({ width: 44, height: 26, borderRadius: 13, background: on ? THEME.primary : THEME.textFaint, position: 'relative', cursor: 'pointer', flexShrink: 0 }),
  toggleKnob: (on) => ({ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: on ? 21 : 3, boxShadow: '0 1px 3px rgba(0,0,0,.25)' }),
  footer: { padding: '14px 16px calc(14px + env(safe-area-inset-bottom))', background: THEME.surface, borderTop: `1px solid ${THEME.border}` },
  saveBtn: { width: '100%', border: 'none', cursor: 'pointer', padding: 13, borderRadius: THEME.radiusSm, background: THEME.primary, color: '#fff', fontSize: 15, fontWeight: 700, outline: 'none' },
  errorBox: { background: THEME.errorBg, color: THEME.error, padding: '10px 12px', borderRadius: THEME.radiusSm, fontSize: 13, fontWeight: 600, margin: '0 20px' },
};

const UNITS = [
  { key: 'day', label: '天' },
  { key: 'week', label: '週' },
  { key: 'month', label: '個月' },
];

export default function TaskForm({ task, onSave, onCancel }) {
  const isEdit = !!task;

  const [title, setTitle] = useState(task?.title || '');
  const [intervalValue, setIntervalValue] = useState(task?.interval_value || 1);
  const [intervalUnit, setIntervalUnit] = useState(task?.interval_unit || 'month');
  const [due, setDue] = useState(task?.next_due || todayKey());
  const [showOnCalendar, setShowOnCalendar] = useState(task?.show_on_calendar !== false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  const titleInvalid = touched && !title.trim();

  const handleSave = async () => {
    setError('');
    setTouched(true);
    if (!title.trim() || !due) return;
    const iv = Math.max(1, parseInt(intervalValue, 10) || 1);
    setBusy(true);
    try {
      await onSave({
        title: title.trim(),
        interval_value: iv,
        interval_unit: intervalUnit,
        next_due: due,
        show_on_calendar: showOnCalendar,
      }, task?.id);
    } catch (e) {
      setError(e.message || '儲存失敗');
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={S.header}>
        <button type="button" onClick={onCancel} disabled={busy} style={S.backBtn} aria-label="返回">←</button>
        <div style={S.title}>{isEdit ? '編輯任務' : '新增任務'}</div>
      </div>

      {error && <div style={{ ...S.errorBox, marginTop: 16 }}>{error}</div>}

      <div style={S.body}>
        <div>
          <div style={S.fieldLabel}>標題 <span style={S.required}>＊</span></div>
          <input
            style={{ ...S.input, ...(titleInvalid ? S.inputError : {}) }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：換床單"
          />
          {titleInvalid && <div style={S.errorText}>請輸入標題</div>}
        </div>

        <div>
          <div style={S.fieldLabel}>重複間隔</div>
          <div style={S.intervalRow}>
            <input type="number" min="1" style={S.intervalInput} value={intervalValue} onChange={(e) => setIntervalValue(e.target.value)} />
            <div style={S.unitSegment}>
              {UNITS.map((u) => (
                <button key={u.key} type="button" style={S.unitBtn(intervalUnit === u.key)} onClick={() => setIntervalUnit(u.key)}>{u.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div style={S.fieldLabel}>{isEdit ? '下次到期日' : '起始到期日'} <span style={S.required}>＊</span></div>
          <input type="date" style={S.input} value={due} onChange={(e) => setDue(e.target.value)} />
        </div>

        <div style={S.toggleRow}>
          <div style={S.toggleTextWrap}>
            <div style={S.toggleTitle}>顯示在行事曆</div>
            <div style={S.toggleHint}>到期日會出現在月/週/日檢視</div>
          </div>
          <div style={S.toggleTrack(showOnCalendar)} onClick={() => setShowOnCalendar((v) => !v)}>
            <div style={S.toggleKnob(showOnCalendar)} />
          </div>
        </div>
      </div>

      <div style={S.footer}>
        <button type="button" style={S.saveBtn} onClick={handleSave} disabled={busy}>{busy ? '儲存中…' : '儲存'}</button>
      </div>
    </div>
  );
}
