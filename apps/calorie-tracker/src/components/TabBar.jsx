// Four tab buttons at the bottom: Today / Reports / Challenge / Settings（樣式在 shared 的 BottomTabs，三個 app 共用）
import React from 'react';
import BottomTabs from '@peggy-life/shared/BottomTabs.jsx';

const TABS = [
  { key: 'today',     label: '紀錄', icon: 'flame' },
  { key: 'reports',   label: '報表', icon: 'chart' },
  { key: 'challenge', label: '挑戰', icon: 'trophy' },
  { key: 'settings',  label: '設定', icon: 'sliders' },
];

export default function TabBar({ tab, onTab }) {
  return <BottomTabs tabs={TABS} active={tab} onChange={onTab} />;
}
