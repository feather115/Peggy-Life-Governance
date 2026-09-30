// 週檢視：一週 7 天直向列表，每天一張卡片，列出當天紀錄+任務（TimelineItems）。
// 換週的 ‹ › 在 App.jsx 的頁首右側。點日期標題跳去日檢視（openDay）、標題右邊「＋」直接在那天新增紀錄；
// 卡片點擊行為跟月/日檢視一樣。
import React, { useMemo } from 'react';
import Icon from '@peggy-life/shared/Icon.jsx';
import { UI } from '@peggy-life/shared/ui';
import { DOW, buildDayTimeline, getWeekDays, parseDateKey, todayKey } from '../utils.js';
import { THEME } from '../theme.js';
import TimelineItems from './TimelineItems.jsx';

const S = {
  panel: { padding: '8px 20px 24px', display: 'flex', flexDirection: 'column', gap: 12 },
  dayCard: (selected) => ({ ...UI.listCard, boxShadow: selected ? `0 0 0 2px ${THEME.primaryInk}` : 'var(--shadow-card)' }),
  dayHeader: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px 6px 16px', borderBottom: `1px solid ${THEME.border}` },
  dayOpenBtn: { flex: 1, minHeight: 40, display: 'flex', alignItems: 'center', gap: 8, padding: 0, border: 'none', background: 'none', textAlign: 'left' },
  dayLabel: { fontSize: 15, fontWeight: 600, color: THEME.textDark },
  dayAddBtn: { ...UI.iconBtnSoft, width: 32, height: 32 },
};

export default function WeekView({ anchorKey, selectedDateKey, onOpenDay, onCreate, recordsByDate, categories, tasksByDueDate, onEditRecord, onEditTask, onCompleteTask }) {
  const anchor = parseDateKey(anchorKey);
  const weekDays = useMemo(() => getWeekDays(anchor), [anchor]);
  const today = todayKey();

  return (
    <div style={S.panel}>
      {weekDays.map((dateKey) => {
        const date = parseDateKey(dateKey);
        const md = `${date.getMonth() + 1}/${date.getDate()}`;
        const timeline = buildDayTimeline(recordsByDate[dateKey], tasksByDueDate?.[dateKey]);
        const isToday = dateKey === today;
        const isSelected = dateKey === selectedDateKey;
        return (
          <section key={dateKey} aria-label={`${md} 週${DOW[date.getDay()]}`} style={S.dayCard(isSelected)}>
            <div style={S.dayHeader}>
              <button type="button" style={S.dayOpenBtn} onClick={() => onOpenDay(dateKey)}>
                <span style={S.dayLabel}>{md} 週{DOW[date.getDay()]}</span>
                {isToday && <span style={UI.tag('primary')}>今天</span>}
                <Icon name="chevron-right" size={16} style={{ color: THEME.textFaint }} />
              </button>
              <button type="button" className="tap" style={S.dayAddBtn} onClick={() => onCreate(dateKey)} aria-label={`新增 ${md} 的紀錄`}>
                <Icon name="plus" size={16} strokeWidth={2} />
              </button>
            </div>
            {timeline.length === 0
              ? <div style={UI.empty}>沒有事件</div>
              : (
                <TimelineItems
                  timeline={timeline}
                  categories={categories}
                  onRecordClick={onEditRecord}
                  onTaskClick={onEditTask}
                  onTaskComplete={onCompleteTask}
                />
              )}
          </section>
        );
      })}
    </div>
  );
}
