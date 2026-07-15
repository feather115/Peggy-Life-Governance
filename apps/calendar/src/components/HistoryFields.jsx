// 地點/和誰的輸入欄位，RecordForm 共用。
// 預設是文字輸入框，打字時下方即時列出包含相同字的歷史選項（點一下帶入）；
// 想瀏覽全部選項才按「清單」切換成下拉選單。history 由呼叫端依「最近使用」排序（App.jsx 的 recentMenus）。
import React, { useState } from 'react';
import { THEME } from '../theme.js';

const SUGGEST_LIMIT = 5;

const S = {
  input: { width: '100%', boxSizing: 'border-box', border: `1px solid ${THEME.border}`, borderRadius: THEME.radiusSm, padding: '11px 12px', fontSize: 15, color: THEME.textDark, background: THEME.surface, outline: 'none' },
  row: { display: 'flex', gap: 8 },
  backBtn: { border: `1px solid ${THEME.border}`, background: THEME.surface, cursor: 'pointer', padding: '0 12px', borderRadius: THEME.radiusSm, fontSize: 12, color: THEME.textMuted, fontWeight: 600, whiteSpace: 'nowrap' },
  chipsWrap: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: { display: 'flex', alignItems: 'center', gap: 4, background: THEME.primarySoft, color: THEME.primary, fontSize: 13, fontWeight: 600, padding: '5px 8px 5px 12px', borderRadius: 999 },
  chipRemove: { cursor: 'pointer', fontSize: 14, lineHeight: 1 },
  addBtn: { border: 'none', cursor: 'pointer', padding: '0 16px', borderRadius: THEME.radiusSm, background: THEME.primarySoft, color: THEME.primary, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 },
  suggestWrap: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  suggestChip: { border: `1px dashed ${THEME.border}`, background: THEME.surface, cursor: 'pointer', padding: '5px 12px', borderRadius: 999, fontSize: 13, color: THEME.textDark },
};

// 打字內容 q 對歷史選項做「包含」搜尋，最多列 SUGGEST_LIMIT 筆（history 已依最近使用排序）
function matchHistory(q, names) {
  const query = q.trim();
  if (!query) return [];
  return names.filter((n) => n.includes(query)).slice(0, SUGGEST_LIMIT);
}

// 推薦列：dashed 圓 chip，點一下帶入。用 onMouseDown preventDefault 避免先觸發輸入框 blur。
function Suggestions({ items, onPick }) {
  if (items.length === 0) return null;
  return (
    <div style={S.suggestWrap}>
      {items.map((name) => (
        <button key={name} type="button" style={S.suggestChip} onMouseDown={(e) => e.preventDefault()} onClick={() => onPick(name)}>
          {name}
        </button>
      ))}
    </div>
  );
}

// 多選欄位（地點/和誰/標籤）：已選的顯示成 tag chips（可 × 移除），
// 輸入框打字時下方推薦、Enter/「加入」送出新值；「清單」切換成下拉選單瀏覽全部。
// history 項目可以是字串，也可以是 { value, label }（label 用來在選單裡縮排子標籤，選了存的是 value）。
export function PeopleSelect({ people, onChange, history, addPlaceholder = '輸入名字後按 Enter' }) {
  const [listMode, setListMode] = useState(false);
  const [draft, setDraft] = useState('');
  const items = history.map((h) => (typeof h === 'string' ? { value: h, label: h } : h));
  const available = items.filter((it) => !people.includes(it.value));

  const add = (name) => {
    setDraft('');
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

      {listMode ? (
        <select
          autoFocus
          style={S.input}
          value=""
          onBlur={() => setListMode(false)}
          onChange={(e) => { if (e.target.value) add(e.target.value); setListMode(false); }}
        >
          <option value="">＋ 選擇加入…</option>
          {available.map((it) => <option key={it.value} value={it.value}>{it.label}</option>)}
        </select>
      ) : (
        <div>
          <div style={S.row}>
            <input
              type="text"
              style={S.input}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => add(draft.trim())}
              onKeyDown={(e) => { if (e.nativeEvent.isComposing) return; if (e.key === 'Enter') { e.preventDefault(); add(draft.trim()); } if (e.key === 'Escape') setDraft(''); }}
              placeholder={addPlaceholder}
            />
            <button type="button" style={S.addBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => add(draft.trim())}>加入</button>
            {available.length > 0 && (
              <button type="button" style={S.backBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => setListMode(true)}>清單</button>
            )}
          </div>
          <Suggestions items={matchHistory(draft, available.map((it) => it.value))} onPick={add} />
        </div>
      )}
    </div>
  );
}
