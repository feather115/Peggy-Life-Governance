// 日檢視：單日事件 + 日記合併時間軸，可切換前一天/後一天，底部有「新增事件」「新增日記」按鈕。
// 卡片渲染在 TimelineItems（2026-07-10 起三個檢視共用同一套白卡版型），這裡只負責
// 日期導覽、空狀態與新增按鈕。
import React from 'react';
import { buildDayTimeline, dayLabel } from '../utils.js';
import { THEME } from '../theme.js';
import TimelineItems from './TimelineItems.jsx';

const S = {
  wrap: { display: 'flex', flexDirection: 'column', minHeight: '100%' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 10px' },
  navBtn: { border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: THEME.textMuted, padding: '4px 10px', outline: 'none' },
  title: { fontSize: 16, fontWeight: 700, color: THEME.textDark },
  list: { flex: 1, padding: '4px 20px 16px' },
  empty: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', fontSize: 14, color: THEME.textFaint },
  footer: { position: 'sticky', bottom: 0, padding: '14px 20px calc(14px + env(safe-area-inset-bottom))', background: THEME.bg, display: 'flex', gap: 10 },
  addEventBtn: { flex: 1, border: 'none', cursor: 'pointer', padding: 13, borderRadius: THEME.radiusSm, background: THEME.primary, color: '#fff', fontSize: 15, fontWeight: 700, outline: 'none' },
  addDiaryBtn: { flex: 1, border: `1px solid ${THEME.primary}`, cursor: 'pointer', padding: 13, borderRadius: THEME.radiusSm, background: THEME.surface, color: THEME.primary, fontSize: 15, fontWeight: 700, outline: 'none' },
};

export default function DayView({ dateKey, onShiftDay, eventsByDate, entriesByDate, categories, tasksByDueDate, onEdit, onCreate, onEditDiary, onCreateDiary, onGoToTasks }) {
  const dayEvents = eventsByDate[dateKey] || [];
  const dayEntries = (entriesByDate && entriesByDate[dateKey]) || [];
  const dayTasks = (tasksByDueDate && tasksByDueDate[dateKey]) || [];
  const timeline = buildDayTimeline(dayEvents, dayEntries, dayTasks);

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <button type="button" onClick={() => onShiftDay(-1)} style={S.navBtn} aria-label="前一天">‹</button>
        <div style={S.title}>{dayLabel(dateKey)}</div>
        <button type="button" onClick={() => onShiftDay(1)} style={S.navBtn} aria-label="後一天">›</button>
      </div>

      <div style={S.list}>
        {timeline.length === 0 ? (
          <div style={S.empty}>這天還沒有記錄</div>
        ) : (
          <TimelineItems
            timeline={timeline}
            categories={categories}
            onEventClick={onEdit}
            onDiaryClick={onEditDiary}
            onTaskClick={onGoToTasks ? () => onGoToTasks() : undefined}
          />
        )}
      </div>

      <div style={S.footer}>
        <button type="button" style={S.addEventBtn} onClick={() => onCreate(dateKey)}>＋ 新增事件</button>
        <button type="button" style={S.addDiaryBtn} onClick={() => onCreateDiary(dateKey)}>＋ 新增日記</button>
      </div>
    </div>
  );
}
