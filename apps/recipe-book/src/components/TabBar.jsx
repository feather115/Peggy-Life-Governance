// Bottom navigation for the recipe book app.
import React from 'react';

const TABS = [
  { key: 'recipes', label: '食譜' },
  { key: 'calendar', label: '行事曆' },
];

export default function TabBar({ tab, onTab, hideTabs = [] }) {
  const visibleTabs = TABS.filter((t) => !hideTabs.includes(t.key));
  return (
    <div style={{ flex: 'none', background: '#fff', boxShadow: '0 -4px 20px rgba(61,40,30,.08)' }}>
      <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
        {visibleTabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onTab(t.key)}
              style={{
                border: 'none',
                background: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                cursor: 'pointer',
                padding: '4px 28px',
              }}
            >
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: active ? '#E87A24' : 'transparent' }} />
              <span style={{ fontSize: 13, fontWeight: 900, color: active ? '#E87A24' : '#C5B4AC' }}>{t.label}</span>
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 8 }}>
        <div style={{ width: 128, height: 5, borderRadius: 5, background: 'rgba(61,40,30,.14)' }} />
      </div>
    </div>
  );
}
