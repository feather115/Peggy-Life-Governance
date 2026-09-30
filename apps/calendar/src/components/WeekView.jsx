// 週檢視：一週 7 天直向列表，每天下面列出當天紀錄+任務（TimelineItems）。
// 點日期標題跳去日檢視（openDay）、標題右邊「＋」直接在那天新增紀錄；卡片點擊行為跟月/日檢視一樣。
import React, { useMemo } from 'react';
import Icon from '@peggy-life/shared/Icon.jsx';
import { DOW, buildDayTimeline, getWeekDays, parseDateKey, todayKey, weekRangeLabel } from '../utils.js';
import { THEME } from '../theme.js';
import TimelineItems from './TimelineItems.jsx';

const S = {
  panel: { margin: '6px 20px 20px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px', background: THEME.surface, borderRadius: THEME.radiusSm, boxShadow: THEME.shadow },
  navBtn: { border: 'none', background: 'none', color: THEME.textMuted, width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: 700, color: THEME.textDark },
  dayRow: (selected) => ({ marginTop: 12, paddingBottom: 12, background: THEME.surfaceAlt2, borderRadius: THEME.radiusSm, overflow: 'hidden', boxShadow: selected ? `0 0 0 2px ${THEME.primaryInk}` : 'none' }),
  dayHeader: (dark) => ({ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px 6px 12px', marginBottom: 10, background: dark ? 'var(--band-2)' : 'var(--band-1)' }),
  dayOpenBtn: { flex: 1, display: 'flex', alignItems: 'center', gap: 8, minHeight: 36 },
  dayLabel: { fontSize: 14, fontWeight: 700, color: THEME.textDark },
  todayBadge: { fontSize: 12, fontWeight: 700, color: '#fff', background: THEME.primary, padding: '2px 7px', borderRadius: 999 },
  dayAddBtn: { width: 32, height: 32, flex: 'none', borderRadius: '50%', background: THEME.surface, color: THEME.primaryInk, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dayContent: { padding: '0 10px' },
  empty: { padding: '0 2px', fontSize: 13, color: THEME.textFaint },
};

export default function WeekView({ anchorKey, onShift, selectedDateKey, onOpenDay, onCreate, recordsByDate, categories, tasksByDueDate, onEditRecord, onEditTask, onCompleteTask }) {
  const anchor = parseDateKey(anchorKey);
  const weekDays = useMemo(() => getWeekDays(anchor), [anchor]);
  const today = todayKey();

  return (
    <div style={S.panel}>
      <div style={S.header}>
        <button type="button" onClick={() => onShift(-1)} style={S.navBtn} aria-label="上一週"><Icon name="chevron-left" size={22} /></button>
        <div style={S.title}>{weekRangeLabel(weekDays)}</div>
        <button type="button" onClick={() => onShift(1)} style={S.navBtn} aria-label="下一週"><Icon name="chevron-right" size={22} /></button>
      </div>

      {weekDays.map((dateKey, index) => {
        const date = parseDateKey(dateKey);
        const md = `${date.getMonth() + 1}/${date.getDate()}`;
        const timeline = buildDayTimeline(recordsByDate[dateKey], tasksByDueDate?.[dateKey]);
        const isToday = dateKey === today;
        const isSelected = dateKey === selectedDateKey;
        const darkHeader = index % 2 === 1;
        return (
          <div key={dateKey} style={S.dayRow(isSelected)}>
            <div style={S.dayHeader(darkHeader)}>
              <button type="button" className="btn-reset" style={S.dayOpenBtn} onClick={() => onOpenDay(dateKey)}>
                <span style={S.dayLabel}>{md} 週{DOW[date.getDay()]}</span>
                {isToday && <span style={S.todayBadge}>今天</span>}
                <Icon name="chevron-right" size={16} style={{ color: THEME.textMuted }} />
              </button>
              <button type="button" className="btn-reset tap" style={S.dayAddBtn} onClick={() => onCreate(dateKey)} aria-label={`新增 ${md} 的紀錄`}>
                <Icon name="plus" size={16} />
              </button>
            </div>
            <div style={S.dayContent}>
              {timeline.length === 0
                ? <div style={S.empty}>沒有事件</div>
                : (
                  <TimelineItems
                    timeline={timeline}
                    categories={categories}
                    onRecordClick={onEditRecord}
                    onTaskClick={onEditTask}
                    onTaskComplete={onCompleteTask}
                  />
                )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
