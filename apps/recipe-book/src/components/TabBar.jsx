// Bottom navigation for the recipe book app.
import React from 'react';
import Icon from '@peggy-life/shared/Icon.jsx';

const TABS = [
  { key: 'recipes', label: '食譜', icon: 'book' },
  { key: 'calendar', label: '行事曆', icon: 'calendar' },
  { key: 'settings', label: '設定', icon: 'sliders' },
];

export default function TabBar({ tab, onTab, hideTabs = [] }) {
  const visibleTabs = TABS.filter((t) => !hideTabs.includes(t.key));
  return (
    <nav aria-label="主選單" style={{ flex: 'none', background: 'var(--surface)', boxShadow: 'var(--shadow-nav)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'space-around', padding: '6px 8px 4px' }}>
        {visibleTabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onTab(t.key)}
              aria-current={active ? 'page' : undefined}
              style={{
                flex: 1,
                minHeight: 52,
                border: 'none',
                background: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                color: active ? 'var(--primary-ink)' : 'var(--text-faint)',
              }}
            >
              <span style={{ width: 52, height: 28, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? 'var(--primary-soft)' : 'transparent' }}>
                <Icon name={t.icon} size={20} />
              </span>
              <span style={{ fontSize: 12, fontWeight: 900 }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
