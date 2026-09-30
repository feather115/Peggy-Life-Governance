// 日檢視：單日紀錄 + 到期任務合併時間軸，可切換前一天/後一天（也可左右滑動）。
// 卡片渲染在 TimelineItems（三個檢視共用同一套白卡版型與點擊行為），這裡只負責日期導覽與空狀態；
// 新增紀錄是 App.jsx 右下角的浮動 ＋ 按鈕。
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
  // 底部留空間給浮動 ＋ 按鈕，最後一張卡片才不會被蓋住
  list: { flex: 1, padding: '4px 20px 96px' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '60px 0', fontSize: 14, color: THEME.textFaint, textAlign: 'center' },
};

export default function DayView({ dateKey, onShiftDay, recordsByDate, categories, tasksByDueDate, onEdit, onEditTask, onCompleteTask }) {
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
            <div style={{ fontSize: 13 }}>按右下角的 ＋ 新增紀錄</div>
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
    </div>
  );
}
