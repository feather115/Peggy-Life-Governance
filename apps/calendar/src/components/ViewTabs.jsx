// 月/週/日檢視切換 + 回到今天。
import React from 'react';

const TABS = [
  { key: 'month', label: '月' },
  { key: 'week', label: '週' },
  { key: 'day', label: '日' },
];

export default function ViewTabs({ view, onChange, onToday }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px 0' }}>
      <div style={{ display: 'flex', gap: 6, flex: 1 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            style={{
              flex: 1,
              border: 'none',
              background: view === t.key ? '#4A6FA5' : '#E9EEF6',
              color: view === t.key ? '#fff' : '#4A6FA5',
              padding: '9px 8px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 900,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onToday}
        style={{ border: 'none', background: '#E9EEF6', color: '#4A6FA5', fontWeight: 800, fontSize: 12, padding: '9px 12px', borderRadius: 12, cursor: 'pointer', outline: 'none' }}
      >
        今天
      </button>
    </div>
  );
}
