// Four tab buttons at the bottom: Today / Reports / Challenge / Settings
import React from 'react';

const TABS = [
  { key: 'today',     label: '今日' },
  { key: 'reports',   label: '報表' },
  { key: 'challenge', label: '挑戰' },
  { key: 'settings',  label: '設定' },
];

export default function TabBar({ tab, onTab }) {
  return (
    <div style={{ flex: 'none', background: '#fff', boxShadow: '0 -4px 20px rgba(0,0,0,.06)' }}>
      <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => onTab(t.key)}
            style={{ border: 'none', background: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', padding: '4px 16px' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: tab === t.key ? '#2E8B5E' : 'transparent' }} />
            <span style={{ fontSize: 13, fontWeight: 900, color: tab === t.key ? '#2E8B5E' : '#9bb0a3' }}>{t.label}</span>
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 8 }}>
        <div style={{ width: 128, height: 5, borderRadius: 5, background: 'rgba(35,64,52,.15)' }} />
      </div>
    </div>
  );
}
