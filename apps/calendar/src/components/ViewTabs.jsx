// 底部導覽列：月/週/日/任務四個檢視（2026-09-30 從頂端的分段按鈕移到底部，跟另外兩個 app 的
// 底部分頁列一致，單手拇指也按得到）。「今天」按鈕在 App.jsx 的 header 右側。
import React from 'react';
import Icon from '@peggy-life/shared/Icon.jsx';
import { THEME } from '../theme.js';

const TABS = [
  { key: 'month', label: '月', icon: 'calendar' },
  { key: 'week', label: '週', icon: 'rows' },
  { key: 'day', label: '日', icon: 'sun' },
  { key: 'tasks', label: '任務', icon: 'check-square' },
];

const S = {
  nav: { flex: 'none', background: THEME.surface, boxShadow: 'var(--shadow-nav)', paddingBottom: 'env(safe-area-inset-bottom)' },
  row: { display: 'flex', alignItems: 'stretch', justifyContent: 'space-around', padding: '6px 8px 4px' },
  tab: (active) => ({ flex: 1, minHeight: 52, border: 'none', background: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: active ? THEME.primary : THEME.textFaint }),
  pill: (active) => ({ width: 52, height: 28, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? THEME.primarySoft : 'transparent' }),
  label: { fontSize: 12, fontWeight: 700 },
};

export default function ViewTabs({ view, onChange }) {
  return (
    <nav aria-label="檢視切換" style={S.nav}>
      <div style={S.row}>
        {TABS.map((t) => {
          const active = view === t.key;
          return (
            <button key={t.key} type="button" onClick={() => onChange(t.key)} aria-current={active ? 'page' : undefined} style={S.tab(active)}>
              <span style={S.pill(active)}><Icon name={t.icon} size={20} /></span>
              <span style={S.label}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
