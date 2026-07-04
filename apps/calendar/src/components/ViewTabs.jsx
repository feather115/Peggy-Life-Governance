// 月/週/日/任務切換 + 回到今天（任務檢視沒有「今天」的概念，不顯示該按鈕）。
import React from 'react';
import { THEME } from '../theme.js';

const TABS = [
  { key: 'month', label: '月' },
  { key: 'week', label: '週' },
  { key: 'day', label: '日' },
  { key: 'tasks', label: '任務' },
];

const S = {
  wrap: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: THEME.bg },
  segment: { flex: 1, display: 'flex', background: THEME.surfaceAlt, borderRadius: THEME.radiusSm, padding: 3, gap: 2 },
  tab: (active) => ({
    flex: 1,
    border: 'none',
    cursor: 'pointer',
    padding: '8px 0',
    borderRadius: THEME.radiusSmInner,
    fontSize: 14,
    fontWeight: 600,
    background: active ? THEME.primary : 'transparent',
    color: active ? '#fff' : THEME.textMuted,
    outline: 'none',
  }),
  todayBtn: { border: `1px solid ${THEME.border}`, background: THEME.surface, cursor: 'pointer', padding: '9px 14px', borderRadius: THEME.radiusSm, fontSize: 13, fontWeight: 600, color: THEME.primary, whiteSpace: 'nowrap', outline: 'none' },
};

export default function ViewTabs({ view, onChange, onToday }) {
  return (
    <div style={S.wrap}>
      <div style={S.segment}>
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => onChange(t.key)} style={S.tab(view === t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      {view !== 'tasks' && <button type="button" onClick={onToday} style={S.todayBtn}>今天</button>}
    </div>
  );
}
