// App shell: loads data, manages current tab / selected date / open sheets, and assembles the UI.
// Note: This only acts as a coordinator; actual data logic resides in useAppData, and UI components are in components/.
import React, { useState } from 'react';
import { useRefreshOnReturn } from '@peggy-life/shared/useRefreshOnReturn';
import { useAppData } from './useAppData.js';
import { todayKey } from './utils.js';
import TabBar from './components/TabBar.jsx';
import TodayTab from './components/TodayTab.jsx';
import ReportsTab from './components/ReportsTab.jsx';
import SettingsTab from './components/SettingsTab.jsx';
import ChallengeTab from './components/ChallengeTab.jsx';
import FoodSheet from './components/FoodSheet.jsx';
import AdvancedSheet from './components/AdvancedSheet.jsx';
import LoadingSkeleton, { LoadError } from '@peggy-life/shared/LoadingSkeleton.jsx';

export default function App({ session, onSignOut }) {
  const app = useAppData(session.user.id);

  // Pure UI states (not persisted to DB)
  const [tab, setTab] = useState('today');
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [sheetMeal, setSheetMeal] = useState(null);    // Which meal's food sheet is open (null = closed)
  const [advancedOpen, setAdvancedOpen] = useState(false);
  useRefreshOnReturn(app.refresh);

  if (!app.loaded) return <LoadingSkeleton />;
  if (app.loadError) return <LoadError message={app.loadError} />;

  const changeTab = (t) => { setTab(t); setSheetMeal(null); setAdvancedOpen(false); };
  const openDateInToday = (dateKey) => {
    setSelectedDate(dateKey);
    changeTab('today');
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 520, height: '100vh', maxHeight: '100dvh', margin: '0 auto', background: 'var(--bg)', display: 'flex', flexDirection: 'column', boxShadow: '0 0 60px -20px rgba(0,0,0,.12)', overflow: 'hidden' }}>
      <div className="ps" style={{ flex: 1, overflowY: 'auto', paddingTop: 8 }}>
        {tab === 'today' && (
          <TodayTab app={app} selectedDate={selectedDate} setSelectedDate={setSelectedDate}
            onOpenSheet={setSheetMeal} onOpenAdvanced={() => setAdvancedOpen(true)} />
        )}
        {tab === 'reports' && <ReportsTab app={app} onSelectDate={openDateInToday} />}
        {tab === 'challenge' && <ChallengeTab app={app} />}
        {tab === 'settings' && <SettingsTab app={app} session={session} onSignOut={onSignOut} />}
      </div>

      <TabBar tab={tab} onTab={changeTab} />

      {sheetMeal && <FoodSheet app={app} selectedDate={selectedDate} mealKey={sheetMeal} onClose={() => setSheetMeal(null)} />}
      {advancedOpen && <AdvancedSheet app={app} selectedDate={selectedDate} onClose={() => setAdvancedOpen(false)} />}
    </div>
  );
}
