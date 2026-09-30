// 時間選擇：預設是 30 分鐘一格的下拉選單，選「自訂時間…」才切換成可以輸入任意分鐘的原生時間輸入框。
import React, { useState } from 'react';
import { UI } from '@peggy-life/shared/ui';

const OPTIONS = [];
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}
const CUSTOM = '__custom__';

const S = {
  input: { ...UI.input },
  row: { display: 'flex', gap: 8 },
  customBtn: { ...UI.btnNeutral, minHeight: 44, padding: '0 12px', fontSize: 13 },
};

export default function TimeSelect({ value, onChange, label = '時間' }) {
  const [customMode, setCustomMode] = useState(!!value && !OPTIONS.includes(value));

  if (customMode) {
    return (
      <div style={S.row}>
        <input aria-label={label} type="time" style={S.input} value={value} onChange={(e) => onChange(e.target.value)} />
        <button type="button" style={S.customBtn} onClick={() => setCustomMode(false)}>整點/半點</button>
      </div>
    );
  }

  return (
    <select aria-label={label}
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
