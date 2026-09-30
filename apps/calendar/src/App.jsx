// App 外殼：520px 置中容器，載入 useRecords + useDiaryTags + useTasks，依 view 切換月/週/日/任務或表單。
// 覆蓋畫面（表單/設定）統一用一個 overlay state 管理：
//   null
//   | { type: 'record', mode: 'create', dateKey } | { type: 'record', mode: 'edit', record }
//   | { type: 'task', mode: 'create' } | { type: 'task', mode: 'edit', task }
//   | { type: 'settings' } | { type: 'manageTags' } | { type: 'manageOptions' }
// 之後要加新畫面就加一個 type，不要再疊三元運算子鏈。
import React, { useMemo, useRef, useState } from 'react';
import Icon from '@peggy-life/shared/Icon.jsx';
import { useBackClose } from '@peggy-life/shared/useBackClose';
import { useRefreshOnReturn } from '@peggy-life/shared/useRefreshOnReturn';
import { useRecords } from './useRecords.js';
import { useDiaryTags } from './useDiaryTags.js';
import { useTasks } from './useTasks.js';
import { useOptions } from './useOptions.js';
import { UI } from '@peggy-life/shared/ui';
import { THEME } from './theme.js';
import { DOW, getWeekDays, parseDateKey, todayKey, weekRangeLabel } from './utils.js';
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
import { toast } from '@peggy-life/shared/feedback.jsx';
import LoadingSkeleton, { LoadError } from '@peggy-life/shared/LoadingSkeleton.jsx';

const S = {
  header: { ...UI.header, flex: 'none', paddingBottom: 12 },
  backToday: { minHeight: 28, padding: '0 10px', border: 'none', borderRadius: 999, background: THEME.primarySoft, color: THEME.primaryInk, fontSize: 12, fontWeight: 500 },
};

// 頁首標題與前後切換的文字：月/週/日各自顯示目前翻到的範圍；離開「今天」時副標旁出現「回到今天」
const NAV_LABELS = {
  month: ['上一個月', '下一個月'],
  week: ['上一週', '下一週'],
  day: ['前一天', '後一天'],
};
function headerInfo(view, anchorKey, selectedDateKey, taskCount) {
  const today = todayKey();
  if (view === 'tasks') return { title: '任務', sub: `共 ${taskCount} 項 · 依到期日排序`, onToday: true };
  const anchor = parseDateKey(anchorKey);
  const now = parseDateKey(today);
  if (view === 'month') {
    const sameMonth = anchor.getFullYear() === now.getFullYear() && anchor.getMonth() === now.getMonth();
    return { title: `${anchor.getMonth() + 1} 月`, sub: `${anchor.getFullYear()} 年`, onToday: sameMonth && selectedDateKey === today };
  }
  if (view === 'week') {
    const days = getWeekDays(anchor);
    return { title: weekRangeLabel(days), sub: `${anchor.getFullYear()} 年`, onToday: days.includes(today) && selectedDateKey === today };
  }
  const d = parseDateKey(selectedDateKey);
  const isToday = selectedDateKey === today;
  return { title: `${d.getMonth() + 1} 月 ${d.getDate()} 日`, sub: `${isToday ? '今天 · ' : ''}週${DOW[d.getDay()]}`, onToday: isToday };
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
  useRefreshOnReturn(() => { rec.refresh(); diaryTags.refresh(); tasksHub.refresh(); opts.refresh(); });

  // 手機返回鍵：管理頁回設定頁、其他覆蓋畫面直接關閉（紀錄表單有未儲存防呆，自己在 RecordForm 裡處理）
  useBackClose(overlay !== null && overlay.type !== 'record', () => {
    if (overlay?.type === 'manageTags' || overlay?.type === 'manageOptions') setOverlay({ type: 'settings' });
    else closeOverlay();
  });

  // 月/週/日檢視左右滑動翻頁（跟 ‹ › 按鈕同一個 shiftPeriod）；垂直捲動、在輸入框上滑動都不算
  const touchStart = useRef(null);
  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchStart.current = e.target.closest('input, textarea, select') ? null : { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || rec.view === 'tasks') return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 2) rec.shiftPeriod(dx < 0 ? 1 : -1);
  };

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

  if (!rec.loaded || !diaryTags.loaded || !tasksHub.loaded || !opts.loaded) return <LoadingSkeleton />;
  if (rec.loadError) return <LoadError message={rec.loadError} />;
  if (diaryTags.loadError) return <LoadError message={diaryTags.loadError} />;
  if (tasksHub.loadError) return <LoadError message={tasksHub.loadError} />;

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
  const createRecord = (dateKey) => setOverlay({ type: 'record', mode: 'create', dateKey });
  const editTask = (task) => setOverlay({ type: 'task', mode: 'edit', task });

  const completeTask = async (task, doneDate) => {
    const updated = await tasksHub.confirmComplete(task.id, doneDate);
    const next = updated && parseDateKey(updated.next_due);
    // 任務會移到下次到期日、從今天的時間軸消失，不提示會以為它不見了
    toast(`已完成「${task.title}」${next ? `，下次到期 ${next.getMonth() + 1}/${next.getDate()}` : ''}`);
  };

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
  const fabDate = parseDateKey(rec.selectedDateKey);
  const head = headerInfo(rec.view, rec.anchorKey, rec.selectedDateKey, tasksHub.tasks.length);
  const navLabels = NAV_LABELS[rec.view];

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
      boxShadow: '0 0 0 1px var(--line)',
      overflow: 'hidden',
    }}>
      {overlayNode ? (
        <div className="ps" style={{ flex: 1, overflowY: 'auto' }}>
          {overlayNode}
        </div>
      ) : (
        <>
          <header style={S.header}>
            <div style={{ minWidth: 0 }}>
              <h1 style={UI.title}>{head.title}</h1>
              <p style={UI.subtitle}>
                {head.sub}
                {!head.onToday && <button type="button" className="tap" onClick={rec.goToday} style={S.backToday}>回到今天</button>}
              </p>
            </div>
            <div style={UI.headerActions}>
              {navLabels && <>
                <button type="button" onClick={() => rec.shiftPeriod(-1)} aria-label={navLabels[0]} style={UI.iconBtn}><Icon name="chevron-left" size={20} /></button>
                <button type="button" onClick={() => rec.shiftPeriod(1)} aria-label={navLabels[1]} style={UI.iconBtn}><Icon name="chevron-right" size={20} /></button>
              </>}
              <button type="button" onClick={() => setOverlay({ type: 'settings' })} aria-label="設定" style={{ ...UI.iconBtn, color: THEME.textMuted }}><Icon name="sliders" size={20} /></button>
            </div>
          </header>

          <div className="ps" style={{ flex: 1, overflowY: 'auto', minHeight: 0, position: 'relative', background: THEME.bg }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            {rec.view === 'month' && (
              <MonthView
                anchorKey={rec.anchorKey}
                selectedDateKey={rec.selectedDateKey}
                onSelectDay={rec.setSelectedDateKey}
                onOpenDay={rec.openDay}
                onCreate={createRecord}
                recordsByDate={rec.recordsByDate}
                categories={diaryTags.categories}
                tasksByDueDate={tasksHub.tasksByDueDate}
                onEditRecord={editRecord}
                onEditTask={editTask}
                onCompleteTask={completeTask}
              />
            )}
            {rec.view === 'week' && (
              <WeekView
                anchorKey={rec.anchorKey}
                selectedDateKey={rec.selectedDateKey}
                onOpenDay={rec.openDay}
                onCreate={createRecord}
                recordsByDate={rec.recordsByDate}
                categories={diaryTags.categories}
                tasksByDueDate={tasksHub.tasksByDueDate}
                onEditRecord={editRecord}
                onEditTask={editTask}
                onCompleteTask={completeTask}
              />
            )}
            {rec.view === 'day' && (
              <DayView
                dateKey={rec.selectedDateKey}
                recordsByDate={rec.recordsByDate}
                categories={diaryTags.categories}
                tasksByDueDate={tasksHub.tasksByDueDate}
                onEdit={editRecord}
                onEditTask={editTask}
                onCompleteTask={completeTask}
              />
            )}
            {rec.view === 'tasks' && (
              <TasksView
                tasks={tasksHub.tasks}
                onEdit={editTask}
                onDelete={tasksHub.deleteTask}
                onComplete={completeTask}
              />
            )}
          </div>

          {/* 浮動新增按鈕：日檢視新增這一天的紀錄、任務檢視新增任務（月/週檢視在各自的日期卡上有新增按鈕） */}
          {rec.view === 'day' && (
            <button type="button" style={UI.fab} onClick={() => createRecord(rec.selectedDateKey)} aria-label={`新增 ${fabDate.getMonth() + 1}/${fabDate.getDate()} 的紀錄`}>
              <Icon name="plus" size={24} strokeWidth={2} />
            </button>
          )}
          {rec.view === 'tasks' && (
            <button type="button" style={UI.fab} onClick={() => setOverlay({ type: 'task', mode: 'create' })} aria-label="新增任務">
              <Icon name="plus" size={24} strokeWidth={2} />
            </button>
          )}

          <ViewTabs view={rec.view} onChange={rec.setView} />
        </>
      )}
    </div>
  );
}
