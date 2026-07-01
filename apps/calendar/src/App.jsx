// App 外殼：520px 置中容器，載入 useEvents，依 view 切換月/週/日檢視或事件表單。
import React, { useState } from 'react';
import { useEvents } from './useEvents.js';
import ViewTabs from './components/ViewTabs.jsx';
import MonthView from './components/MonthView.jsx';
import WeekView from './components/WeekView.jsx';
import DayView from './components/DayView.jsx';
import EventForm from './components/EventForm.jsx';

function Centered({ children, color = '#4A6FA5' }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, color, fontWeight: 700 }}>
      {children}
    </div>
  );
}

export default function App({ session, onSignOut }) {
  const userId = session.user.id;
  const cal = useEvents(userId);
  // editing: null | { mode: 'create', dateKey } | { mode: 'edit', event }
  const [editing, setEditing] = useState(null);

  if (!cal.loaded) return <Centered>載入中…</Centered>;
  if (cal.loadError) return <Centered color="#B91C1C">載入失敗：{cal.loadError}</Centered>;

  const goToDay = (dateKey) => { cal.setAnchorKey(dateKey); cal.setView('day'); };

  const handleSave = async (payload, existingId) => {
    if (existingId) await cal.updateEvent(existingId, payload);
    else await cal.createEvent(payload);
    setEditing(null);
  };

  const handleDelete = async (eventId) => {
    await cal.deleteEvent(eventId);
    setEditing(null);
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: 520,
      height: '100vh',
      maxHeight: '100dvh',
      margin: '0 auto',
      background: '#EEF1F6',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 0 60px -20px rgba(0,0,0,.12)',
      overflow: 'hidden',
    }}>
      {editing ? (
        <div className="ps" style={{ flex: 1, overflowY: 'auto' }}>
          <EventForm
            event={editing.mode === 'edit' ? editing.event : null}
            defaultDateKey={editing.mode === 'create' ? editing.dateKey : undefined}
            onSave={handleSave}
            onDelete={editing.mode === 'edit' ? handleDelete : null}
            onCancel={() => setEditing(null)}
          />
        </div>
      ) : (
        <>
          <header style={{ padding: '14px 18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#233A5E', margin: 0 }}>TY Calendar</h1>
            <button onClick={onSignOut} style={{ border: 'none', background: '#E9EEF6', color: '#4A6FA5', fontWeight: 800, fontSize: 13, padding: '8px 14px', borderRadius: 14, cursor: 'pointer', outline: 'none' }}>登出</button>
          </header>

          <ViewTabs view={cal.view} onChange={cal.setView} onToday={cal.goToday} />

          <div className="ps" style={{ flex: 1, overflowY: 'auto', padding: '4px 18px 20px' }}>
            {cal.view === 'month' && (
              <MonthView
                anchorKey={cal.anchorKey}
                onAnchorChange={cal.setAnchorKey}
                eventsByDate={cal.eventsByDate}
                onSelectDay={goToDay}
              />
            )}
            {cal.view === 'week' && (
              <WeekView
                anchorKey={cal.anchorKey}
                onAnchorChange={cal.setAnchorKey}
                eventsByDate={cal.eventsByDate}
                onSelectDay={goToDay}
              />
            )}
            {cal.view === 'day' && (
              <DayView
                anchorKey={cal.anchorKey}
                onAnchorChange={cal.setAnchorKey}
                eventsByDate={cal.eventsByDate}
                onEdit={(event) => setEditing({ mode: 'edit', event })}
                onCreate={(dateKey) => setEditing({ mode: 'create', dateKey })}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
