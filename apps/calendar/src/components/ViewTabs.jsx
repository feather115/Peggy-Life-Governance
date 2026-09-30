// 底部導覽列：月/週/日/任務四個檢視（2026-09-30 從頂端的分段按鈕移到底部，跟另外兩個 app 的
// 底部分頁列一致，單手拇指也按得到）。樣式在 shared 的 BottomTabs，三個 app 共用。
// 前後切換（‹ ›）、回到今天、設定都在 App.jsx 的頁首右側。
import React from 'react';
import BottomTabs from '@peggy-life/shared/BottomTabs.jsx';

const TABS = [
  { key: 'month', label: '月', icon: 'calendar' },
  { key: 'week', label: '週', icon: 'rows' },
  { key: 'day', label: '日', icon: 'sun' },
  { key: 'tasks', label: '任務', icon: 'check-square' },
];

export default function ViewTabs({ view, onChange }) {
  return <BottomTabs tabs={TABS} active={view} onChange={onChange} label="檢視切換" />;
}
