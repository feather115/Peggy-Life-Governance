// App 外殼：載入資料、管理「目前分頁 / 選取日期 / 哪個面板打開」，把畫面組起來。
// 注意：這裡只做「協調」，實際資料邏輯都在 useAppData，畫面都在 components/。
import React, { useState } from 'react';
import { useAppData } from './useAppData.js';
import { todayKey } from './utils.js';
import TabBar from './components/TabBar.jsx';
import TodayTab from './components/TodayTab.jsx';
import ReportsTab from './components/ReportsTab.jsx';
import SettingsTab from './components/SettingsTab.jsx';
import ChallengeTab from './components/ChallengeTab.jsx';
import FoodSheet from './components/FoodSheet.jsx';
import ImportSheet from './components/ImportSheet.jsx';
import AdvancedSheet from './components/AdvancedSheet.jsx';

function Centered({ children, color = '#6E8B7C' }) {
  return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, color, fontWeight: 700 }}>{children}</div>;
}

export default function App({ session, onSignOut }) {
  const app = useAppData(session.user.id);

  // 純 UI 狀態（不進資料庫）
  const [tab, setTab] = useState('today');
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [sheetMeal, setSheetMeal] = useState(null);    // 哪個餐別的食物面板打開（null=關）
  const [importOpen, setImportOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  if (!app.loaded) return <Centered>載入中…</Centered>;
  if (app.loadError) return <Centered color="#B91C1C">載入失敗：{app.loadError}</Centered>;

  const changeTab = (t) => { setTab(t); setSheetMeal(null); setImportOpen(false); setAdvancedOpen(false); };
  const openDateInToday = (dateKey) => {
    setSelectedDate(dateKey);
    changeTab('today');
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 520, height: '100vh', maxHeight: '100dvh', margin: '0 auto', background: '#EAF5EE', display: 'flex', flexDirection: 'column', boxShadow: '0 0 60px -20px rgba(0,0,0,.12)', overflow: 'hidden' }}>
      <div className="ps" style={{ flex: 1, overflowY: 'auto', paddingTop: 8 }}>
        {tab === 'today' && (
          <TodayTab app={app} selectedDate={selectedDate} setSelectedDate={setSelectedDate}
            onOpenSheet={setSheetMeal} onOpenImport={() => setImportOpen(true)} onOpenAdvanced={() => setAdvancedOpen(true)} />
        )}
        {tab === 'reports' && <ReportsTab app={app} onSelectDate={openDateInToday} />}
        {tab === 'challenge' && <ChallengeTab app={app} />}
        {tab === 'settings' && <SettingsTab app={app} session={session} onSignOut={onSignOut} />}
      </div>

      <TabBar tab={tab} onTab={changeTab} />

      {sheetMeal && <FoodSheet app={app} selectedDate={selectedDate} mealKey={sheetMeal} onClose={() => setSheetMeal(null)} />}
      {importOpen && <ImportSheet app={app} onClose={() => setImportOpen(false)} />}
      {advancedOpen && <AdvancedSheet app={app} selectedDate={selectedDate} onClose={() => setAdvancedOpen(false)} />}
    </div>
  );
}
