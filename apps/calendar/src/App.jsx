// App 外殼：520px 置中容器，載入 useRecords + useDiaryTags + useTasks，依 view 切換月/週/日/任務或表單。
// 覆蓋畫面（表單/設定）統一用一個 overlay state 管理：
//   null
//   | { type: 'record', mode: 'create', dateKey } | { type: 'record', mode: 'edit', record }
//   | { type: 'task', mode: 'create' } | { type: 'task', mode: 'edit', task }
//   | { type: 'settings' } | { type: 'manageTags' } | { type: 'manageOptions' }
// 之後要加新畫面就加一個 type，不要再疊三元運算子鏈。
import React, { useMemo, useState } from 'react';
import { useRecords } from './useRecords.js';
import { useDiaryTags } from './useDiaryTags.js';
import { useTasks } from './useTasks.js';
import { useOptions } from './useOptions.js';
import { THEME } from './theme.js';
import { dateKeyFrom, parseDateKey } from './utils.js';
import ViewTabs from './components/ViewTabs.jsx';
import MonthView from './components/MonthView.jsx';
import WeekView from './components/WeekView.jsx';
import DayView from './components/DayView.jsx';
import TasksView from './components/TasksView.jsx';
import RecordForm from './components/RecordForm.jsx';
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
  const rec = useRecords(userId);
  // 分類標籤改名/刪除要同步過去紀錄的 diary_tags，靠 useRecords 提供的兩個同步函式
  const diaryTags = useDiaryTags(userId, {
    renameTag: rec.renameDiaryTagEverywhere,
    removeTags: rec.removeDiaryTagsEverywhere,
  });
  const tasksHub = useTasks(userId);
  const opts = useOptions(userId);

  const [overlay, setOverlay] = useState(null);
  const closeOverlay = () => setOverlay(null);

  // 地點/人名選單依「最近一次使用」排序：從紀錄（start_at）補入未成功回填到選項庫的歷史值
  // （已封存者除外），再依最近使用排序。
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
    rec.records.forEach((r) => {
      const ts = new Date(r.start_at).getTime();
      (r.locations || []).forEach((l) => touch('location', l, ts));
      (r.people || []).forEach((p) => touch('person', p, ts));
    });
    const sortBy = (kind, set) =>
      [...set].sort((a, b) => (last.get(`${kind}:${b}`) || 0) - (last.get(`${kind}:${a}`) || 0));
    return {
      locations: sortBy('location', names.location),
      people: sortBy('person', names.person),
    };
  }, [rec.records, opts.menus, opts.options]);

  if (!rec.loaded || !diaryTags.loaded || !tasksHub.loaded || !opts.loaded) return <Centered>載入中…</Centered>;
  if (rec.loadError) return <Centered color={THEME.error}>載入失敗：{rec.loadError}</Centered>;
  if (diaryTags.loadError) return <Centered color={THEME.error}>載入失敗：{diaryTags.loadError}</Centered>;
  if (tasksHub.loadError) return <Centered color={THEME.error}>載入失敗：{tasksHub.loadError}</Centered>;

  const shiftSelectedDay = (delta) => {
    const next = new Date(parseDateKey(rec.selectedDateKey));
    next.setDate(next.getDate() + delta);
    const nextKey = dateKeyFrom(next);
    rec.setAnchorKey(nextKey);
    rec.setSelectedDateKey(nextKey);
  };

  const handleSaveRecord = async (payload, existingId) => {
    if (existingId) await rec.updateRecord(existingId, payload);
    else await rec.createRecord(payload);
    // 新出現的地點/人名/標籤自動補進選項庫，下次選單就有
    await opts.ensureNames([
      { kind: 'location', names: payload.locations },
      { kind: 'person', names: payload.people },
      { kind: 'tag', names: payload.tags },
    ]);
    closeOverlay();
  };

  const handleDeleteRecord = async (recordId) => {
    await rec.deleteRecord(recordId);
    closeOverlay();
  };

  const handleSaveTask = async (payload, existingId) => {
    if (existingId) await tasksHub.updateTask(existingId, payload);
    else await tasksHub.createTask(payload);
    closeOverlay();
  };

  const editRecord = (record) => setOverlay({ type: 'record', mode: 'edit', record });
  const goToTasks = () => { closeOverlay(); rec.setView('tasks'); };

  const renderOverlay = () => {
    switch (overlay?.type) {
      case 'record':
        return (
          <RecordForm
            record={overlay.mode === 'edit' ? overlay.record : null}
            defaultDateKey={overlay.mode === 'create' ? overlay.dateKey : undefined}
            allRecords={rec.records}
            categories={diaryTags.categories}
            locationHistory={recentMenus.locations}
            peopleHistory={recentMenus.people}
            tagOptions={opts.menus.tags}
            onSave={handleSaveRecord}
            onDelete={overlay.mode === 'edit' ? handleDeleteRecord : null}
            onCancel={closeOverlay}
            onAddTag={diaryTags.addTagToCategory}
            tagDetailHistory={rec.tagDetailHistory}
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
            categories={diaryTags.categories}
            onRenameCategory={diaryTags.renameCategory}
            onDeleteCategory={diaryTags.deleteCategory}
            onAddTag={diaryTags.addTagToCategory}
            onRemoveTag={diaryTags.removeTagFromCategory}
            onMoveTag={diaryTags.moveTagToCategory}
            onMoveTagInCategory={diaryTags.moveTagInCategory}
            onRenameTag={diaryTags.renameTagInCategory}
            onAddSubTag={diaryTags.addSubTag}
            onRenameSubTag={diaryTags.renameSubTag}
            onRemoveSubTag={diaryTags.removeSubTag}
            onMoveSubTag={diaryTags.moveSubTag}
            tagDetailHistory={rec.tagDetailHistory}
            onRenameTagDetail={rec.renameTagDetailEverywhere}
            onRemoveTagDetail={rec.removeTagDetailEverywhere}
            onAddCategory={diaryTags.addCategory}
            onMoveCategory={diaryTags.moveCategory}
            onClose={() => setOverlay({ type: 'settings' })}
          />
        );
      case 'manageOptions':
        return (
          <ManageOptions
            opts={opts}
            records={rec.records}
            renameField={rec.renameFieldValue}
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

          <ViewTabs view={rec.view} onChange={rec.setView} onToday={rec.goToday} />

          <div className="ps" style={{ flex: 1, overflowY: 'auto', minHeight: 0, position: 'relative', background: THEME.bg }}>
            {rec.view === 'month' && (
              <MonthView
                anchorKey={rec.anchorKey}
                onAnchorChange={rec.setAnchorKey}
                selectedDateKey={rec.selectedDateKey}
                onSelectDay={rec.setSelectedDateKey}
                onOpenDay={rec.openDay}
                recordsByDate={rec.recordsByDate}
                categories={diaryTags.categories}
                tasksByDueDate={tasksHub.tasksByDueDate}
                onEditRecord={editRecord}
                onGoToTasks={goToTasks}
              />
            )}
            {rec.view === 'week' && (
              <WeekView
                anchorKey={rec.anchorKey}
                onAnchorChange={rec.setAnchorKey}
                selectedDateKey={rec.selectedDateKey}
                onOpenDay={rec.openDay}
                recordsByDate={rec.recordsByDate}
                categories={diaryTags.categories}
                tasksByDueDate={tasksHub.tasksByDueDate}
              />
            )}
            {rec.view === 'day' && (
              <DayView
                dateKey={rec.selectedDateKey}
                onShiftDay={shiftSelectedDay}
                recordsByDate={rec.recordsByDate}
                categories={diaryTags.categories}
                tasksByDueDate={tasksHub.tasksByDueDate}
                onEdit={editRecord}
                onCreate={(dateKey) => setOverlay({ type: 'record', mode: 'create', dateKey })}
                onGoToTasks={goToTasks}
              />
            )}
            {rec.view === 'tasks' && (
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
