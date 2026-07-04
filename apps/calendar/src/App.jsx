// App 外殼：520px 置中容器，載入 useEvents，依 view 切換月/週/日檢視或事件表單。
import React, { useState } from 'react';
import { useEvents } from './useEvents.js';
import { THEME } from './theme.js';
import { dateKeyFrom, parseDateKey } from './utils.js';
import ViewTabs from './components/ViewTabs.jsx';
import MonthView from './components/MonthView.jsx';
import WeekView from './components/WeekView.jsx';
import DayView from './components/DayView.jsx';
import EventForm from './components/EventForm.jsx';

function Centered({ children, color = THEME.primary }) {
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
  if (cal.loadError) return <Centered color={THEME.error}>載入失敗：{cal.loadError}</Centered>;

  const shiftSelectedDay = (delta) => {
    const next = new Date(parseDateKey(cal.selectedDateKey));
    next.setDate(next.getDate() + delta);
    const nextKey = dateKeyFrom(next);
    cal.setAnchorKey(nextKey);
    cal.setSelectedDateKey(nextKey);
  };

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
      background: THEME.bg,
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
            allEvents={cal.events}
            onSave={handleSave}
            onDelete={editing.mode === 'edit' ? handleDelete : null}
            onCancel={() => setEditing(null)}
          />
        </div>
      ) : (
        <>
          <header style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: THEME.surface }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: THEME.textDark, margin: 0 }}>TY Calendar</h1>
            <button onClick={onSignOut} style={{ border: 'none', background: 'none', color: THEME.textMuted, fontWeight: 600, fontSize: 13, cursor: 'pointer', outline: 'none' }}>登出</button>
          </header>

          <ViewTabs view={cal.view} onChange={cal.setView} onToday={cal.goToday} />

          <div className="ps" style={{ flex: 1, overflowY: 'auto', minHeight: 0, position: 'relative', background: THEME.bg }}>
            {cal.view === 'month' && (
              <MonthView
                anchorKey={cal.anchorKey}
                onAnchorChange={cal.setAnchorKey}
                selectedDateKey={cal.selectedDateKey}
                onSelectDay={cal.setSelectedDateKey}
                onOpenDay={cal.openDay}
                eventsByDate={cal.eventsByDate}
              />
            )}
            {cal.view === 'week' && (
              <WeekView
                anchorKey={cal.anchorKey}
                onAnchorChange={cal.setAnchorKey}
                selectedDateKey={cal.selectedDateKey}
                onOpenDay={cal.openDay}
                eventsByDate={cal.eventsByDate}
              />
            )}
            {cal.view === 'day' && (
              <DayView
                dateKey={cal.selectedDateKey}
                onShiftDay={shiftSelectedDay}
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
