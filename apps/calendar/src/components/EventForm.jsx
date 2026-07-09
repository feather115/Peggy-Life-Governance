// 新增 / 編輯事件的表單。event = null 為新增模式。
// allEvents：目前所有事件（給標題自動完成建議用，只在新增模式才出現）。
// 動作列跟 DiaryForm 一致：確認按鈕固定在頂部 header，返回鍵在有未儲存變更時會先確認。
import React, { useMemo, useState } from 'react';
import { fromDatetimeLocalValue, toDatetimeLocalValue } from '../utils.js';
import { EVENT_COLORS, THEME } from '../theme.js';
import TimeSelect from './TimeSelect.jsx';
import { LocationSelect, PeopleSelect } from './HistoryFields.jsx';

const S = {
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: THEME.surface, borderBottom: `1px solid ${THEME.border}` },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  backBtn: { border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: THEME.textMuted, padding: '2px 6px', outline: 'none' },
  title: { fontSize: 17, fontWeight: 700, color: THEME.textDark, margin: 0 },
  confirmBtn: { border: 'none', cursor: 'pointer', padding: '9px 18px', borderRadius: 999, background: THEME.primary, color: '#fff', fontSize: 14, fontWeight: 700, outline: 'none', boxShadow: '0 4px 12px rgba(61,90,128,.28)' },
  body: { padding: '18px 20px 24px' },
  field: { marginBottom: 18 },
  label: { fontSize: 13, color: THEME.textMuted, marginBottom: 6 },
  required: { color: THEME.error },
  input: { width: '100%', boxSizing: 'border-box', border: `1px solid ${THEME.border}`, borderRadius: THEME.radiusSm, padding: '11px 12px', fontSize: 15, color: THEME.textDark, background: THEME.surface, outline: 'none' },
  inputError: { borderColor: THEME.error },
  textarea: { width: '100%', boxSizing: 'border-box', border: `1px solid ${THEME.border}`, borderRadius: THEME.radiusSm, padding: '11px 12px', fontSize: 15, color: THEME.textDark, background: THEME.surface, outline: 'none', minHeight: 76, lineHeight: 1.6, fontFamily: 'inherit', resize: 'vertical' },
  errorText: { fontSize: 12, color: THEME.error, marginTop: 5 },
  suggestions: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  suggestionChip: { cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, background: THEME.surfaceAlt, padding: '5px 10px 5px 8px', borderRadius: 999, fontSize: 12, color: THEME.textDark },
  suggestionDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  colorsRow: { display: 'flex', gap: 8 },
  colorDot: (selected) => ({ cursor: 'pointer', width: 28, height: 28, borderRadius: '50%', border: selected ? `2px solid ${THEME.textDark}` : '2px solid transparent' }),
  toggleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  toggleLabel: { fontSize: 14, color: THEME.textDark, fontWeight: 600 },
  toggleTrack: (on) => ({ width: 44, height: 26, borderRadius: 13, background: on ? THEME.primary : THEME.textFaint, position: 'relative', cursor: 'pointer' }),
  toggleKnob: (on) => ({ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: on ? 21 : 3, boxShadow: '0 1px 3px rgba(0,0,0,.25)' }),
  endRow: { display: 'flex', gap: 8 },
  dateTimeRow: { display: 'flex', gap: 8 },
  dateInput: { flex: 3, boxSizing: 'border-box', border: `1px solid ${THEME.border}`, borderRadius: THEME.radiusSm, padding: '11px 12px', fontSize: 15, color: THEME.textDark, background: THEME.surface, outline: 'none' },
  timeInputWrap: { flex: 2 },
  clearBtn: { border: `1px solid ${THEME.border}`, background: THEME.surface, cursor: 'pointer', padding: '0 14px', borderRadius: THEME.radiusSm, fontSize: 13, color: THEME.textMuted, fontWeight: 600 },
  errorBox: { background: THEME.errorBg, color: THEME.error, padding: '10px 12px', borderRadius: THEME.radiusSm, fontSize: 13, fontWeight: 600, marginBottom: 12 },
  deleteLink: (confirming) => ({ marginTop: 24, textAlign: 'center', fontSize: 13, fontWeight: 600, color: confirming ? THEME.error : THEME.textMuted, cursor: 'pointer' }),
};

// 新增事件時預設開始時間：選定日期的早上 9 點
function defaultStartValue(dateKey) {
  const d = dateKey ? new Date(dateKey) : new Date();
  d.setHours(9, 0, 0, 0);
  return toDatetimeLocalValue(d.toISOString());
}

export default function EventForm({ event, defaultDateKey, allEvents = [], locationHistory = [], peopleHistory = [], tagOptions = [], onSave, onDelete, onCancel }) {
  const isEdit = !!event;

  const [title, setTitle] = useState(event?.title || '');
  const [color, setColor] = useState(event?.color || EVENT_COLORS[0]);
  const [tags, setTags] = useState(event?.tags || []);
  const [description, setDescription] = useState(event?.description || '');
  const [location, setLocation] = useState(event?.location || '');
  const [people, setPeople] = useState(event?.people || []);
  const [allDay, setAllDay] = useState(!!event?.all_day);
  const [startValue, setStartValue] = useState(
    event ? toDatetimeLocalValue(event.start_at) : defaultStartValue(defaultDateKey),
  );
  const [endValue, setEndValue] = useState(event?.end_at ? toDatetimeLocalValue(event.end_at) : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [titleTouched, setTitleTouched] = useState(false);

  // 未儲存變更防呆：記住第一次 render 的欄位快照，按返回時有差異就先問一聲
  const snapshot = JSON.stringify({ title, color, tags, description, location, people, allDay, startValue, endValue });
  const [initialSnapshot] = useState(snapshot);
  const handleCancel = () => {
    if (snapshot !== initialSnapshot && !window.confirm('內容還沒儲存，確定要離開嗎？')) return;
    onCancel();
  };

  // 過去用過的標題（新增模式才顯示，輸入時比對片段），點了直接帶入標題 + 顏色
  const titleSuggestions = useMemo(() => {
    if (isEdit) return [];
    const query = title.trim().toLowerCase();
    if (!query) return [];
    const seen = new Map();
    allEvents.forEach((ev) => {
      const t = ev.title;
      if (!t || t.toLowerCase() === query) return;
      if (!t.toLowerCase().includes(query)) return;
      if (!seen.has(t)) seen.set(t, ev);
    });
    return Array.from(seen.entries()).slice(0, 5);
  }, [allEvents, title, isEdit]);

  const toggleAllDay = () => {
    const nowAllDay = !allDay;
    setAllDay(nowAllDay);
    if (nowAllDay) {
      if (startValue.length > 10) setStartValue(startValue.slice(0, 10));
      if (endValue.length > 10) setEndValue(endValue.slice(0, 10));
    } else {
      if (startValue.length === 10) setStartValue(`${startValue}T09:00`);
      if (endValue.length === 10) setEndValue(`${endValue}T09:00`);
    }
  };

  const handleSave = async () => {
    setError('');
    setTitleTouched(true);
    if (!title.trim()) return;
    if (!startValue) { setError('請選擇開始時間'); return; }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      people,
      all_day: allDay,
      start_at: fromDatetimeLocalValue(allDay ? `${startValue.slice(0, 10)}T00:00` : startValue),
      end_at: endValue ? fromDatetimeLocalValue(allDay ? `${endValue.slice(0, 10)}T00:00` : endValue) : null,
      color,
      tags,
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

  const titleInvalid = titleTouched && !title.trim();

  return (
    <div>
      <header style={S.header}>
        <div style={S.headerLeft}>
          <button type="button" onClick={handleCancel} disabled={busy} style={S.backBtn} aria-label="返回">←</button>
          <h1 style={S.title}>{isEdit ? '編輯事件' : '新增事件'}</h1>
        </div>
        <button type="button" onClick={handleSave} disabled={busy} style={S.confirmBtn}>{busy ? '儲存中…' : '儲存'}</button>
      </header>

      <div style={S.body}>
        {error && <div style={S.errorBox}>{error}</div>}

        <div style={S.field}>
          <div style={S.label}>標題 <span style={S.required}>＊</span></div>
          <input
            style={{ ...S.input, ...(titleInvalid ? S.inputError : {}) }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：牙醫回診"
          />
          {titleInvalid && <div style={S.errorText}>請輸入標題</div>}
          {titleSuggestions.length > 0 && (
            <div style={S.suggestions}>
              {titleSuggestions.map(([t, ev]) => (
                <div key={t} style={S.suggestionChip} onClick={() => { setTitle(t); setColor(ev.color || EVENT_COLORS[0]); }}>
                  <span style={{ ...S.suggestionDot, background: ev.color || THEME.primary }} />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={S.field}>
          <div style={S.label}>顏色</div>
          <div style={S.colorsRow}>
            {EVENT_COLORS.map((c) => (
              <div key={c} style={{ ...S.colorDot(color === c), background: c }} onClick={() => setColor(c)} />
            ))}
          </div>
        </div>

        <div style={S.toggleRow}>
          <div style={S.toggleLabel}>全天事件</div>
          <div style={S.toggleTrack(allDay)} onClick={toggleAllDay}>
            <div style={S.toggleKnob(allDay)} />
          </div>
        </div>

        <div style={S.field}>
          <div style={S.label}>開始時間 <span style={S.required}>＊</span></div>
          {allDay ? (
            <input
              type="date"
              style={S.input}
              value={startValue.slice(0, 10)}
              onChange={(e) => setStartValue(e.target.value)}
            />
          ) : (
            <div style={S.dateTimeRow}>
              <input
                type="date"
                style={S.dateInput}
                value={startValue.slice(0, 10)}
                onChange={(e) => setStartValue(`${e.target.value}T${startValue.slice(11, 16)}`)}
              />
              <div style={S.timeInputWrap}>
                <TimeSelect
                  value={startValue.slice(11, 16)}
                  onChange={(t) => setStartValue(`${startValue.slice(0, 10)}T${t}`)}
                />
              </div>
            </div>
          )}
        </div>

        <div style={S.field}>
          <div style={S.label}>結束時間 <span style={{ color: THEME.textFaint }}>(選填)</span></div>
          {allDay ? (
            <div style={S.endRow}>
              <input
                type="date"
                style={S.input}
                value={endValue.slice(0, 10)}
                onChange={(e) => setEndValue(e.target.value)}
              />
              {endValue && <button type="button" style={S.clearBtn} onClick={() => setEndValue('')}>清除</button>}
            </div>
          ) : (
            <div style={S.dateTimeRow}>
              <input
                type="date"
                style={S.dateInput}
                value={endValue.slice(0, 10)}
                onChange={(e) => setEndValue(`${e.target.value}T${endValue.slice(11, 16) || '09:00'}`)}
              />
              <div style={S.timeInputWrap}>
                <TimeSelect
                  value={endValue.slice(11, 16)}
                  onChange={(t) => setEndValue(`${endValue.slice(0, 10) || startValue.slice(0, 10)}T${t}`)}
                />
              </div>
              {endValue && <button type="button" style={S.clearBtn} onClick={() => setEndValue('')}>清除</button>}
            </div>
          )}
        </div>

        <div style={S.field}>
          <div style={S.label}>地點 <span style={{ color: THEME.textFaint }}>(選填)</span></div>
          <LocationSelect value={location} onChange={setLocation} history={locationHistory} placeholder="例如：台大醫院" />
        </div>

        <div style={S.field}>
          <div style={S.label}>和誰 <span style={{ color: THEME.textFaint }}>(選填)</span></div>
          <PeopleSelect people={people} onChange={setPeople} history={peopleHistory} />
        </div>

        <div style={S.field}>
          <div style={S.label}>描述 <span style={{ color: THEME.textFaint }}>(選填)</span></div>
          <textarea style={S.textarea} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="備註…" />
        </div>

        <div style={S.field}>
          <div style={S.label}>標籤 <span style={{ color: THEME.textFaint }}>(選填)</span></div>
          <PeopleSelect people={tags} onChange={setTags} history={tagOptions} addPlaceholder="輸入標籤後按 Enter" />
        </div>

        {isEdit && onDelete && (
          <div style={S.deleteLink(confirmDelete)} onClick={busy ? undefined : handleDelete}>
            {confirmDelete ? '確定要刪除嗎？' : '刪除事件'}
          </div>
        )}
      </div>
    </div>
  );
}
