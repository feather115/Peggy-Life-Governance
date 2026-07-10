// 地點/和誰的歷史選單輸入，EventForm 與 DiaryForm 共用。
// 跟 TimeSelect 同一套慣例：下拉選單列出歷史選項，選「自行輸入…」才切換成文字輸入框。
import React, { useState } from 'react';
import { THEME } from '../theme.js';

const CUSTOM = '__custom__';

const S = {
  input: { width: '100%', boxSizing: 'border-box', border: `1px solid ${THEME.border}`, borderRadius: THEME.radiusSm, padding: '11px 12px', fontSize: 15, color: THEME.textDark, background: THEME.surface, outline: 'none' },
  row: { display: 'flex', gap: 8 },
  backBtn: { border: `1px solid ${THEME.border}`, background: THEME.surface, cursor: 'pointer', padding: '0 12px', borderRadius: THEME.radiusSm, fontSize: 12, color: THEME.textMuted, fontWeight: 600, whiteSpace: 'nowrap' },
  chipsWrap: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: { display: 'flex', alignItems: 'center', gap: 4, background: THEME.primarySoft, color: THEME.primary, fontSize: 13, fontWeight: 600, padding: '5px 8px 5px 12px', borderRadius: 999 },
  chipRemove: { cursor: 'pointer', fontSize: 14, lineHeight: 1 },
  addBtn: { border: 'none', cursor: 'pointer', padding: '0 16px', borderRadius: THEME.radiusSm, background: THEME.primarySoft, color: THEME.primary, fontSize: 13, fontWeight: 700 },
};

// 地點：下拉選單（歷史地點 + 不填 + 自行輸入…）。value 不在歷史裡（或還沒有歷史）就直接顯示輸入框。
export function LocationSelect({ value, onChange, history, placeholder }) {
  const [customMode, setCustomMode] = useState(!!value && !history.includes(value));

  if (history.length === 0 || customMode) {
    return (
      <div style={S.row}>
        <input type="text" style={S.input} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
        {history.length > 0 && (
          <button type="button" style={S.backBtn} onClick={() => { setCustomMode(false); onChange(''); }}>從清單選</button>
        )}
      </div>
    );
  }

  return (
    <select
      style={S.input}
      value={history.includes(value) ? value : ''}
      onChange={(e) => {
        if (e.target.value === CUSTOM) { setCustomMode(true); onChange(''); return; }
        onChange(e.target.value);
      }}
    >
      <option value="">（不填）</option>
      {history.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
      <option value={CUSTOM}>自行輸入…</option>
    </select>
  );
}

// 多選欄位（和誰/事件標籤）：已選的顯示成 tag chips（可 × 移除），下拉選單從歷史加入，
// 選「自行輸入…」打開文字輸入框加新值。history 項目可以是字串，也可以是 { value, label }
// （label 用來在選單裡縮排子標籤，選了存的是 value）。
export function PeopleSelect({ people, onChange, history, addPlaceholder = '輸入名字後按 Enter' }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const items = history.map((h) => (typeof h === 'string' ? { value: h, label: h } : h));
  const available = items.filter((it) => !people.includes(it.value));

  const addDraft = () => {
    const name = draft.trim();
    setDraft('');
    setAdding(false);
    if (name && !people.includes(name)) onChange([...people, name]);
  };

  return (
    <div>
      {people.length > 0 && (
        <div style={S.chipsWrap}>
          {people.map((name) => (
            <div key={name} style={S.chip}>
              <span>{name}</span>
              <span style={S.chipRemove} onClick={() => onChange(people.filter((p) => p !== name))}>×</span>
            </div>
          ))}
        </div>
      )}

      {adding || history.length === 0 ? (
        <div style={S.row}>
          <input
            autoFocus={adding}
            type="text"
            style={S.input}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.nativeEvent.isComposing) return; if (e.key === 'Enter') { e.preventDefault(); addDraft(); } if (e.key === 'Escape') { setDraft(''); setAdding(false); } }}
            placeholder={addPlaceholder}
          />
          <button type="button" style={S.addBtn} onMouseDown={(e) => e.preventDefault()} onClick={addDraft}>加入</button>
          {history.length > 0 && (
            <button type="button" style={S.backBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => { setDraft(''); setAdding(false); }}>從清單選</button>
          )}
        </div>
      ) : (
        <select
          style={S.input}
          value=""
          onChange={(e) => {
            if (e.target.value === CUSTOM) { setAdding(true); return; }
            if (e.target.value) onChange([...people, e.target.value]);
          }}
        >
          <option value="">＋ 選擇加入…</option>
          {available.map((it) => <option key={it.value} value={it.value}>{it.label}</option>)}
          <option value={CUSTOM}>自行輸入…</option>
        </select>
      )}
    </div>
  );
}
