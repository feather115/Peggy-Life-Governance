// 日檢視：單日紀錄 + 到期任務合併時間軸，可切換前一天/後一天（也可左右滑動），底部有「新增紀錄」按鈕。
// 卡片渲染在 TimelineItems（三個檢視共用同一套白卡版型與點擊行為），這裡只負責日期導覽、空狀態與新增按鈕。
import React from 'react';
import Icon from '@peggy-life/shared/Icon.jsx';
import { buildDayTimeline, dayLabel, todayKey } from '../utils.js';
import { THEME } from '../theme.js';
import TimelineItems from './TimelineItems.jsx';

const S = {
  wrap: { display: 'flex', flexDirection: 'column', minHeight: '100%' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 6px' },
  navBtn: { border: 'none', background: 'none', color: THEME.textMuted, width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  titleWrap: { display: 'flex', alignItems: 'center', gap: 8 },
  title: { fontSize: 16, fontWeight: 700, color: THEME.textDark },
  todayBadge: { fontSize: 12, fontWeight: 700, color: '#fff', background: THEME.primary, padding: '2px 7px', borderRadius: 999 },
  list: { flex: 1, padding: '4px 20px 16px' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '60px 0', fontSize: 14, color: THEME.textFaint, textAlign: 'center' },
  footer: { position: 'sticky', bottom: 0, padding: '14px 20px calc(14px + env(safe-area-inset-bottom))', background: THEME.bg, display: 'flex', gap: 10 },
  addBtn: { flex: 1, border: 'none', padding: 13, borderRadius: THEME.radiusSm, background: THEME.primary, color: '#fff', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
};

export default function DayView({ dateKey, onShiftDay, recordsByDate, categories, tasksByDueDate, onEdit, onCreate, onEditTask, onCompleteTask }) {
  const dayRecords = recordsByDate[dateKey] || [];
  const dayTasks = (tasksByDueDate && tasksByDueDate[dateKey]) || [];
  const timeline = buildDayTimeline(dayRecords, dayTasks);

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <button type="button" onClick={() => onShiftDay(-1)} style={S.navBtn} aria-label="前一天"><Icon name="chevron-left" size={22} /></button>
        <div style={S.titleWrap}>
          <div style={S.title}>{dayLabel(dateKey)}</div>
          {dateKey === todayKey() && <span style={S.todayBadge}>今天</span>}
        </div>
        <button type="button" onClick={() => onShiftDay(1)} style={S.navBtn} aria-label="後一天"><Icon name="chevron-right" size={22} /></button>
      </div>

      <div style={S.list}>
        {timeline.length === 0 ? (
          <div style={S.empty}>
            <div>這天還沒有記錄</div>
            <div style={{ fontSize: 13 }}>按下方「新增紀錄」開始記錄</div>
          </div>
        ) : (
          <TimelineItems
            timeline={timeline}
            categories={categories}
            onRecordClick={onEdit}
            onTaskClick={onEditTask}
            onTaskComplete={onCompleteTask}
          />
        )}
      </div>

      <div style={S.footer}>
        <button type="button" style={S.addBtn} onClick={() => onCreate(dateKey)}><Icon name="plus" size={18} />新增紀錄</button>
      </div>
    </div>
  );
}
