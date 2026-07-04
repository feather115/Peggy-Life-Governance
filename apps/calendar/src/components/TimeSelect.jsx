// 時間選擇：預設是 30 分鐘一格的下拉選單，選「自訂時間…」才切換成可以輸入任意分鐘的原生時間輸入框。
import React, { useState } from 'react';
import { THEME } from '../theme.js';

const OPTIONS = [];
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}
const CUSTOM = '__custom__';

const S = {
  input: { width: '100%', boxSizing: 'border-box', border: `1px solid ${THEME.border}`, borderRadius: THEME.radiusSm, padding: '11px 12px', fontSize: 15, color: THEME.textDark, background: THEME.surface, outline: 'none' },
  row: { display: 'flex', gap: 8 },
  customBtn: { border: `1px solid ${THEME.border}`, background: THEME.surface, cursor: 'pointer', padding: '0 12px', borderRadius: THEME.radiusSm, fontSize: 12, color: THEME.textMuted, fontWeight: 600, whiteSpace: 'nowrap' },
};

export default function TimeSelect({ value, onChange }) {
  const [customMode, setCustomMode] = useState(!!value && !OPTIONS.includes(value));

  if (customMode) {
    return (
      <div style={S.row}>
        <input type="time" style={S.input} value={value} onChange={(e) => onChange(e.target.value)} />
        <button type="button" style={S.customBtn} onClick={() => setCustomMode(false)}>整點/半點</button>
      </div>
    );
  }

  return (
    <select
      style={S.input}
      value={OPTIONS.includes(value) ? value : ''}
      onChange={(e) => {
        if (e.target.value === CUSTOM) { setCustomMode(true); return; }
        onChange(e.target.value);
      }}
    >
      {!OPTIONS.includes(value) && value && <option value={value}>{value}（自訂）</option>}
      {!value && <option value="" disabled>請選擇時間</option>}
      {OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
      <option value={CUSTOM}>自訂時間…</option>
    </select>
  );
}
