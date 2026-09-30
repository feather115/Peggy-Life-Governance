// 日檢視：單日紀錄 + 到期任務合併時間軸（一張白卡、一列一列），前一天/後一天在 App.jsx 頁首右側（也可左右滑動）。
// 列的渲染在 TimelineItems（三個檢視共用），這裡只負責外層卡片與空狀態；新增紀錄是 App.jsx 右下角的浮動 ＋ 按鈕。
import React from 'react';
import Icon from '@peggy-life/shared/Icon.jsx';
import { UI } from '@peggy-life/shared/ui';
import { buildDayTimeline } from '../utils.js';
import { THEME } from '../theme.js';
import TimelineItems from './TimelineItems.jsx';

const S = {
  // 底部留空間給浮動 ＋ 按鈕，最後一列才不會被蓋住
  list: { padding: '8px 20px 100px' },
  empty: { ...UI.card, padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' },
  emptyIcon: { width: 48, height: 48, borderRadius: 999, background: 'var(--sunken)', color: THEME.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' },
};

export default function DayView({ dateKey, recordsByDate, categories, tasksByDueDate, onEdit, onEditTask, onCompleteTask }) {
  const dayRecords = recordsByDate[dateKey] || [];
  const dayTasks = (tasksByDueDate && tasksByDueDate[dateKey]) || [];
  const timeline = buildDayTimeline(dayRecords, dayTasks);

  return (
    <div style={S.list}>
      {timeline.length === 0 ? (
        <div style={S.empty}>
          <span aria-hidden="true" style={S.emptyIcon}><Icon name="calendar" size={22} /></span>
          <div style={{ fontSize: 15, fontWeight: 500, color: THEME.textDark }}>這天還沒有記錄</div>
          <div style={{ fontSize: 13, color: THEME.textMuted }}>按右下角的 ＋ 新增紀錄</div>
        </div>
      ) : (
        <div style={UI.listCard}>
          <TimelineItems
            timeline={timeline}
            categories={categories}
            onRecordClick={onEdit}
            onTaskClick={onEditTask}
            onTaskComplete={onCompleteTask}
          />
        </div>
      )}
    </div>
  );
}
