// App 外殼：520px 置中容器，載入 useEvents + useDiary + useTasks，依 view 切換月/週/日/任務或各種表單。
import React, { useState } from 'react';
import { useEvents } from './useEvents.js';
import { useDiary } from './useDiary.js';
import { useTasks } from './useTasks.js';
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

  // editing: null | { mode: 'create', dateKey } | { mode: 'edit', event }
  const [editing, setEditing] = useState(null);
  // editingDiary: null | { mode: 'create', dateKey } | { mode: 'edit', entry }
  const [editingDiary, setEditingDiary] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [managingTags, setManagingTags] = useState(false);
  // editingTask: null | { mode: 'create' } | { mode: 'edit', task }
  const [editingTask, setEditingTask] = useState(null);

  if (!cal.loaded || !diary.loaded || !tasksHub.loaded) return <Centered>載入中…</Centered>;
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
    setEditing(null);
  };

  const handleDeleteEvent = async (eventId) => {
    await cal.deleteEvent(eventId);
    setEditing(null);
  };

  const handleSaveDiary = async (payload, existingId) => {
    if (existingId) await diary.updateEntry(existingId, payload);
    else await diary.createEntry(payload);
    setEditingDiary(null);
  };

  const handleDeleteDiary = async (entryId) => {
    await diary.deleteEntry(entryId);
    setEditingDiary(null);
  };

  const handleSaveTask = async (payload, existingId) => {
    if (existingId) await tasksHub.updateTask(existingId, payload);
    else await tasksHub.createTask(payload);
    setEditingTask(null);
  };

  const overlay = editing
    ? (
      <EventForm
        event={editing.mode === 'edit' ? editing.event : null}
        defaultDateKey={editing.mode === 'create' ? editing.dateKey : undefined}
        allEvents={cal.events}
        onSave={handleSaveEvent}
        onDelete={editing.mode === 'edit' ? handleDeleteEvent : null}
        onCancel={() => setEditing(null)}
      />
    )
    : editingDiary
    ? (
      <DiaryForm
        entry={editingDiary.mode === 'edit' ? editingDiary.entry : null}
        dateKey={editingDiary.mode === 'edit' ? editingDiary.entry.entry_date : editingDiary.dateKey}
        categories={diary.categories}
        onSave={handleSaveDiary}
        onDelete={editingDiary.mode === 'edit' ? handleDeleteDiary : null}
        onCancel={() => setEditingDiary(null)}
        onAddTag={diary.addTagToCategory}
        tagDetailHistory={diary.tagDetailHistory}
      />
    )
    : showSettings
    ? (
      managingTags
        ? (
          <ManageTags
            categories={diary.categories}
            onRenameCategory={diary.renameCategory}
            onDeleteCategory={diary.deleteCategory}
            onAddTag={diary.addTagToCategory}
            onRemoveTag={diary.removeTagFromCategory}
            onMoveTag={diary.moveTagToCategory}
            onMoveTagInCategory={diary.moveTagInCategory}
            onAddCategory={diary.addCategory}
            onMoveCategory={diary.moveCategory}
            onClose={() => setManagingTags(false)}
          />
        )
        : (
          <Settings
            session={session}
            onClose={() => setShowSettings(false)}
            onManageTags={() => setManagingTags(true)}
          />
        )
    )
    : editingTask
    ? (
      <TaskForm
        task={editingTask.mode === 'edit' ? editingTask.task : null}
        onSave={handleSaveTask}
        onCancel={() => setEditingTask(null)}
      />
    )
    : null;

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
      {overlay ? (
        <div className="ps" style={{ flex: 1, overflowY: 'auto' }}>
          {overlay}
        </div>
      ) : (
        <>
          <header style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: THEME.surface }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: THEME.textDark, margin: 0 }}>TY Calendar</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button onClick={() => setShowSettings(true)} aria-label="設定" style={{ border: 'none', background: 'none', color: THEME.textMuted, fontSize: 18, cursor: 'pointer', outline: 'none', lineHeight: 1 }}>⚙</button>
              <button onClick={onSignOut} style={{ border: 'none', background: 'none', color: THEME.textMuted, fontWeight: 600, fontSize: 13, cursor: 'pointer', outline: 'none' }}>登出</button>
            </div>
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
                onEdit={(event) => setEditing({ mode: 'edit', event })}
                onCreate={(dateKey) => setEditing({ mode: 'create', dateKey })}
                onEditDiary={(entry) => setEditingDiary({ mode: 'edit', entry })}
                onCreateDiary={(dateKey) => setEditingDiary({ mode: 'create', dateKey })}
                onGoToTasks={() => cal.setView('tasks')}
              />
            )}
            {cal.view === 'tasks' && (
              <TasksView
                tasks={tasksHub.tasks}
                onEdit={(task) => setEditingTask({ mode: 'edit', task })}
                onCreate={() => setEditingTask({ mode: 'create' })}
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
