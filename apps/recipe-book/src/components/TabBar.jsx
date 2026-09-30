// Bottom navigation for the recipe book app（樣式在 shared 的 BottomTabs，三個 app 共用）
import React from 'react';
import BottomTabs from '@peggy-life/shared/BottomTabs.jsx';

const TABS = [
  { key: 'recipes', label: '食譜', icon: 'book' },
  { key: 'calendar', label: '行事曆', icon: 'calendar' },
  { key: 'settings', label: '設定', icon: 'sliders' },
];

export default function TabBar({ tab, onTab, hideTabs = [] }) {
  return <BottomTabs tabs={TABS.filter((t) => !hideTabs.includes(t.key))} active={tab} onChange={onTab} />;
}
