// 三個 app 共用的底部分頁列：圖示＋文字，選中的分頁用主色字與淡主色膠囊標示。
// tabs: [{ key, label, icon }]，icon 是 Icon.jsx 的名稱。各 app 的 TabBar / ViewTabs 只決定有哪些分頁。
import React from 'react';
import Icon from './Icon.jsx';

const S = {
  nav: { flex: 'none', background: 'var(--surface)', boxShadow: 'var(--shadow-nav)', paddingBottom: 'env(safe-area-inset-bottom)' },
  row: { display: 'flex', alignItems: 'stretch', justifyContent: 'space-around', padding: '6px 8px' },
  tab: (on) => ({ flex: 1, minHeight: 56, border: 'none', background: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: on ? 'var(--primary-ink)' : 'var(--text-faint)' }),
  pill: (on) => ({ width: 56, height: 30, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? 'var(--primary-soft)' : 'transparent' }),
  label: (on) => ({ fontSize: 12, fontWeight: on ? 600 : 500 }),
};

export default function BottomTabs({ tabs, active, onChange, label = '主選單' }) {
  return (
    <nav aria-label={label} style={S.nav}>
      <div style={S.row}>
        {tabs.map((t) => {
          const on = active === t.key;
          return (
            <button key={t.key} type="button" onClick={() => onChange(t.key)} aria-current={on ? 'page' : undefined} style={S.tab(on)}>
              <span style={S.pill(on)}><Icon name={t.icon} size={22} /></span>
              <span style={S.label(on)}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
