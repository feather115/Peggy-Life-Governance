// App 外殼：520px 置中容器，載入 useEvents + useDiary + useTasks，依 view 切換月/週/日/任務或各種表單。
// 覆蓋畫面（表單/設定）統一用一個 overlay state 管理：
//   null
//   | { type: 'event', mode: 'create', dateKey } | { type: 'event', mode: 'edit', event }
//   | { type: 'diary', mode: 'create', dateKey } | { type: 'diary', mode: 'edit', entry }
//   | { type: 'task', mode: 'create' } | { type: 'task', mode: 'edit', task }
//   | { type: 'settings' } | { type: 'manageTags' } | { type: 'manageOptions' }
// 之後要加新畫面就加一個 type，不要再疊三元運算子鏈。
import React, { useMemo, useState } from 'react';
import { useEvents } from './useEvents.js';
import { useDiary } from './useDiary.js';
import { useTasks } from './useTasks.js';
import { useOptions } from './useOptions.js';
import { THEME } from './theme.js';
import { dateKeyFrom, parseDateKey } from './utils.js';
import ViewTabs from './components/ViewTabs.jsx';
import MonthView from './components/MonthView.jsx';
import WeekView from './components/WeekView.jsx';
import DayView from './components/DayView.jsx';
import TasksView from './components/TasksView.jsx';
import EventForm from './components/EventForm.jsx';
import DiaryForm from './components/DiaryForm.jsx';
import ManageTags from './components/ManageTags.jsx';
import ManageOptions from './components/ManageOptions.jsx';
import Settings from './components/Settings.jsx';
import TaskForm from './components/TaskForm.jsx';

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
  const diary = useDiary(userId);
  const tasksHub = useTasks(userId);
  const opts = useOptions(userId);

  const [overlay, setOverlay] = useState(null);
  const closeOverlay = () => setOverlay(null);

  // 地點/人名選單依「最近一次使用」排序：從事件（start_at）＋日記（entry_date+time）
  // 補入未成功回填到選項庫的歷史值（已封存者除外），再依最近使用排序。
  const recentMenus = useMemo(() => {
    const last = new Map();
    const names = {
      location: new Set(opts.menus.locations),
      person: new Set(opts.menus.people),
    };
    const archived = new Set(opts.options
      .filter((o) => o.archived)
      .map((o) => `${o.kind}:${o.name}`));
    const touch = (kind, name, ts) => {
      if (!name) return;
      const key = `${kind}:${name}`;
      if (!archived.has(key)) names[kind].add(name);
      if (ts > (last.get(key) || 0)) last.set(key, ts);
    };
    cal.events.forEach((ev) => {
      const ts = new Date(ev.start_at).getTime();
      touch('location', ev.location, ts);
      (ev.people || []).forEach((p) => touch('person', p, ts));
    });
    diary.entries.forEach((en) => {
      const ts = new Date(`${en.entry_date}T${en.time || '00:00'}`).getTime();
      (en.locations || []).forEach((l) => touch('location', l, ts));
      (en.people || []).forEach((p) => touch('person', p, ts));
    });
    const sortBy = (kind, names) =>
      [...names].sort((a, b) => (last.get(`${kind}:${b}`) || 0) - (last.get(`${kind}:${a}`) || 0));
    return {
      locations: sortBy('location', names.location),
      people: sortBy('person', names.person),
    };
  }, [cal.events, diary.entries, opts.menus, opts.options]);

  if (!cal.loaded || !diary.loaded || !tasksHub.loaded || !opts.loaded) return <Centered>載入中…</Centered>;
  if (cal.loadError) return <Centered color={THEME.error}>載入失敗：{cal.loadError}</Centered>;
  if (diary.loadError) return <Centered color={THEME.error}>載入失敗：{diary.loadError}</Centered>;
  if (tasksHub.loadError) return <Centered color={THEME.error}>載入失敗：{tasksHub.loadError}</Centered>;

  const shiftSelectedDay = (delta) => {
    const next = new Date(parseDateKey(cal.selectedDateKey));
    next.setDate(next.getDate() + delta);
    const nextKey = dateKeyFrom(next);
    cal.setAnchorKey(nextKey);
    cal.setSelectedDateKey(nextKey);
  };

  const handleSaveEvent = async (payload, existingId) => {
    if (existingId) await cal.updateEvent(existingId, payload);
    else await cal.createEvent(payload);
    // 新出現的地點/人名/標籤自動補進選項庫，下次選單就有
    await opts.ensureNames([
      { kind: 'location', names: [payload.location] },
      { kind: 'person', names: payload.people },
      { kind: 'tag', names: payload.tags },
    ]);
    closeOverlay();
  };

  const handleDeleteEvent = async (eventId) => {
    await cal.deleteEvent(eventId);
    closeOverlay();
  };

  const handleSaveDiary = async (payload, existingId) => {
    if (existingId) await diary.updateEntry(existingId, payload);
    else await diary.createEntry(payload);
    await opts.ensureNames([
      { kind: 'location', names: payload.locations },
      { kind: 'person', names: payload.people },
    ]);
    closeOverlay();
  };

  const handleDeleteDiary = async (entryId) => {
    await diary.deleteEntry(entryId);
    closeOverlay();
  };

  const handleSaveTask = async (payload, existingId) => {
    if (existingId) await tasksHub.updateTask(existingId, payload);
    else await tasksHub.createTask(payload);
    closeOverlay();
  };

  const editEvent = (event) => setOverlay({ type: 'event', mode: 'edit', event });
  const editDiary = (entry) => setOverlay({ type: 'diary', mode: 'edit', entry });
  const goToTasks = () => { closeOverlay(); cal.setView('tasks'); };

  const renderOverlay = () => {
    switch (overlay?.type) {
      case 'event':
        return (
          <EventForm
            event={overlay.mode === 'edit' ? overlay.event : null}
            defaultDateKey={overlay.mode === 'create' ? overlay.dateKey : undefined}
            allEvents={cal.events}
            locationHistory={recentMenus.locations}
            peopleHistory={recentMenus.people}
            tagOptions={opts.menus.tags}
            onSave={handleSaveEvent}
            onDelete={overlay.mode === 'edit' ? handleDeleteEvent : null}
            onCancel={closeOverlay}
          />
        );
      case 'diary':
        return (
          <DiaryForm
            entry={overlay.mode === 'edit' ? overlay.entry : null}
            dateKey={overlay.mode === 'edit' ? overlay.entry.entry_date : overlay.dateKey}
            categories={diary.categories}
            locationHistory={recentMenus.locations}
            peopleHistory={recentMenus.people}
            onSave={handleSaveDiary}
            onDelete={overlay.mode === 'edit' ? handleDeleteDiary : null}
            onCancel={closeOverlay}
            onAddTag={diary.addTagToCategory}
            tagDetailHistory={diary.tagDetailHistory}
          />
        );
      case 'task':
        return (
          <TaskForm
            task={overlay.mode === 'edit' ? overlay.task : null}
            onSave={handleSaveTask}
            onCancel={closeOverlay}
          />
        );
      case 'settings':
        return (
          <Settings
            session={session}
            onClose={closeOverlay}
            onManageTags={() => setOverlay({ type: 'manageTags' })}
            onManageOptions={() => setOverlay({ type: 'manageOptions' })}
            onSignOut={onSignOut}
          />
        );
      case 'manageTags':
        return (
          <ManageTags
            categories={diary.categories}
            onRenameCategory={diary.renameCategory}
            onDeleteCategory={diary.deleteCategory}
            onAddTag={diary.addTagToCategory}
            onRemoveTag={diary.removeTagFromCategory}
            onMoveTag={diary.moveTagToCategory}
            onMoveTagInCategory={diary.moveTagInCategory}
            onRenameTag={diary.renameTagInCategory}
            onAddSubTag={diary.addSubTag}
            onRenameSubTag={diary.renameSubTag}
            onRemoveSubTag={diary.removeSubTag}
            onMoveSubTag={diary.moveSubTag}
            onAddCategory={diary.addCategory}
            onMoveCategory={diary.moveCategory}
            onClose={() => setOverlay({ type: 'settings' })}
          />
        );
      case 'manageOptions':
        return (
          <ManageOptions
            opts={opts}
            events={cal.events}
            entries={diary.entries}
            renameEventField={cal.renameFieldValue}
            renameDiaryField={diary.renameFieldValue}
            onClose={() => setOverlay({ type: 'settings' })}
          />
        );
      default:
        return null;
    }
  };

  const overlayNode = renderOverlay();

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
      {overlayNode ? (
        <div className="ps" style={{ flex: 1, overflowY: 'auto' }}>
          {overlayNode}
        </div>
      ) : (
        <>
          <header style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: THEME.surface }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: THEME.textDark, margin: 0 }}>TY Calendar</h1>
            <button onClick={() => setOverlay({ type: 'settings' })} aria-label="設定" style={{ border: 'none', background: 'none', color: THEME.textMuted, fontSize: 18, cursor: 'pointer', outline: 'none', lineHeight: 1, padding: 4 }}>⚙</button>
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
                entriesByDate={diary.entriesByDate}
                categories={diary.categories}
                tasksByDueDate={tasksHub.tasksByDueDate}
                onEditEvent={editEvent}
                onEditDiary={editDiary}
                onGoToTasks={goToTasks}
              />
            )}
            {cal.view === 'week' && (
              <WeekView
                anchorKey={cal.anchorKey}
                onAnchorChange={cal.setAnchorKey}
                selectedDateKey={cal.selectedDateKey}
                onOpenDay={cal.openDay}
                eventsByDate={cal.eventsByDate}
                entriesByDate={diary.entriesByDate}
                categories={diary.categories}
                tasksByDueDate={tasksHub.tasksByDueDate}
              />
            )}
            {cal.view === 'day' && (
              <DayView
                dateKey={cal.selectedDateKey}
                onShiftDay={shiftSelectedDay}
                eventsByDate={cal.eventsByDate}
                entriesByDate={diary.entriesByDate}
                categories={diary.categories}
                tasksByDueDate={tasksHub.tasksByDueDate}
                onEdit={editEvent}
                onCreate={(dateKey) => setOverlay({ type: 'event', mode: 'create', dateKey })}
                onEditDiary={editDiary}
                onCreateDiary={(dateKey) => setOverlay({ type: 'diary', mode: 'create', dateKey })}
                onGoToTasks={goToTasks}
              />
            )}
            {cal.view === 'tasks' && (
              <TasksView
                tasks={tasksHub.tasks}
                onEdit={(task) => setOverlay({ type: 'task', mode: 'edit', task })}
                onCreate={() => setOverlay({ type: 'task', mode: 'create' })}
                onDelete={tasksHub.deleteTask}
                onConfirmComplete={tasksHub.confirmComplete}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
