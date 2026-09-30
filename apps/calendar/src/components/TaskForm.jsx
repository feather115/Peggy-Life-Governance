// 新增 / 編輯週期性任務。task = null 為新增模式。
import React, { useState } from 'react';
import { THEME } from '../theme.js';
import { UI } from '@peggy-life/shared/ui';
import { todayKey, scrollIntoViewOnMount } from '../utils.js';
import Icon from '@peggy-life/shared/Icon.jsx';

const S = {
  body: { padding: '8px 20px 24px', display: 'flex', flexDirection: 'column', gap: 18 },
  fieldLabel: { ...UI.fieldLabel },
  required: { color: THEME.errorInk },
  input: { ...UI.input },
  inputError: { borderColor: THEME.errorInk },
  errorText: { ...UI.fieldError },
  intervalRow: { display: 'flex', gap: 8, alignItems: 'center' },
  intervalInput: { ...UI.input, width: 72, textAlign: 'center', ...UI.num },
  unitSegment: { ...UI.segTrack, flex: 1 },
  unitBtn: (active) => UI.seg(active),
  toggleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  toggleTextWrap: {},
  toggleTitle: { fontSize: 15, color: THEME.textDark },
  toggleHint: { fontSize: 13, color: THEME.textMuted, marginTop: 2 },
  toggleTrack: (on) => ({ width: 44, height: 26, padding: 0, border: 'none', borderRadius: 999, background: on ? THEME.primary : 'var(--line-strong)', position: 'relative', cursor: 'pointer', flexShrink: 0 }),
  toggleKnob: (on) => ({ width: 20, height: 20, borderRadius: 999, background: '#FFFFFF', position: 'absolute', top: 3, left: on ? 21 : 3, boxShadow: '0 1px 2px rgba(0,0,0,.2)' }),
  footer: { padding: '12px 20px calc(12px + env(safe-area-inset-bottom))' },
  saveBtn: { ...UI.btnPrimary, width: '100%' },
  errorBox: { ...UI.note('danger'), margin: '0 20px' },
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
      <header style={UI.subBar}>
        <button type="button" onClick={onCancel} disabled={busy} style={UI.iconBtn} aria-label="返回"><Icon name="chevron-left" size={20} /></button>
        <h1 style={UI.subTitle}>{isEdit ? '編輯任務' : '新增任務'}</h1>
      </header>

      {error && <div key={error} ref={scrollIntoViewOnMount} role="alert" style={{ ...S.errorBox, marginTop: 16 }}>{error}</div>}

      <div style={S.body}>
        <div>
          <div style={S.fieldLabel}>標題 <span style={S.required}>*</span></div>
          <input aria-label="標題"
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
            <input aria-label="重複間隔" type="number" min="1" style={S.intervalInput} value={intervalValue} onChange={(e) => setIntervalValue(e.target.value)} />
            <div style={S.unitSegment}>
              {UNITS.map((u) => (
                <button key={u.key} type="button" aria-pressed={intervalUnit === u.key} style={S.unitBtn(intervalUnit === u.key)} onClick={() => setIntervalUnit(u.key)}>{u.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div style={S.fieldLabel}>{isEdit ? '下次到期日' : '起始到期日'} <span style={S.required}>*</span></div>
          <input aria-label="到期日" type="date" style={S.input} value={due} onChange={(e) => setDue(e.target.value)} />
        </div>

        <div style={S.toggleRow}>
          <div style={S.toggleTextWrap}>
            <div style={S.toggleTitle}>顯示在行事曆</div>
            <div style={S.toggleHint}>到期日會出現在月/週/日檢視</div>
          </div>
          <button type="button" role="switch" aria-checked={showOnCalendar} aria-label="顯示在行事曆" style={S.toggleTrack(showOnCalendar)} onClick={() => setShowOnCalendar((v) => !v)}>
            <span style={S.toggleKnob(showOnCalendar)} />
          </button>
        </div>
      </div>

      <div style={S.footer}>
        <button type="button" style={{ ...S.saveBtn, opacity: busy ? 0.6 : 1 }} onClick={handleSave} disabled={busy}>{busy ? '儲存中…' : '儲存'}</button>
      </div>
    </div>
  );
}
