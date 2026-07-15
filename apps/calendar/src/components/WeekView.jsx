// 週檢視：一週 7 天直向列表，每天下面列出當天紀錄+任務（TimelineItems），點某一天跳去日檢視（openDay）。
import React, { useMemo } from 'react';
import { DOW, buildDayTimeline, dateKeyFrom, getWeekDays, parseDateKey, todayKey, weekRangeLabel } from '../utils.js';
import { THEME } from '../theme.js';
import TimelineItems from './TimelineItems.jsx';

const S = {
  panel: { background: THEME.surface, borderRadius: THEME.radius, padding: 14, margin: '6px 20px 20px', boxShadow: THEME.shadow },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: THEME.textMuted, padding: '4px 10px', outline: 'none' },
  title: { fontSize: 15, fontWeight: 700, color: THEME.textDark },
  dayRow: (selected) => ({ cursor: 'pointer', padding: '12px 12px', marginTop: 8, background: selected ? THEME.primarySoft : THEME.surfaceAlt2, borderRadius: THEME.radiusSm }),
  dayHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  dayLabel: { fontSize: 14, fontWeight: 700, color: THEME.textDark },
  todayBadge: { fontSize: 11, fontWeight: 700, color: '#fff', background: THEME.primary, padding: '2px 7px', borderRadius: 999 },
  empty: { fontSize: 13, color: THEME.textFaint },
};

export default function WeekView({ anchorKey, onAnchorChange, selectedDateKey, onOpenDay, recordsByDate, categories, tasksByDueDate }) {
  const anchor = parseDateKey(anchorKey);
  const weekDays = useMemo(() => getWeekDays(anchor), [anchor]);
  const today = todayKey();

  const shiftWeek = (delta) => {
    const next = new Date(anchor);
    next.setDate(next.getDate() + delta * 7);
    onAnchorChange(dateKeyFrom(next));
  };

  return (
    <div style={S.panel}>
      <div style={S.header}>
        <button type="button" onClick={() => shiftWeek(-1)} style={S.navBtn} aria-label="上一週">‹</button>
        <div style={S.title}>{weekRangeLabel(weekDays)}</div>
        <button type="button" onClick={() => shiftWeek(1)} style={S.navBtn} aria-label="下一週">›</button>
      </div>

      {weekDays.map((dateKey) => {
        const date = parseDateKey(dateKey);
        const timeline = buildDayTimeline(recordsByDate[dateKey], tasksByDueDate?.[dateKey]);
        const isToday = dateKey === today;
        const isSelected = dateKey === selectedDateKey;
        return (
          <div key={dateKey} style={S.dayRow(isSelected)} onClick={() => onOpenDay(dateKey)}>
            <div style={S.dayHeader}>
              <span style={S.dayLabel}>{date.getMonth() + 1}/{date.getDate()} 週{DOW[date.getDay()]}</span>
              {isToday && <span style={S.todayBadge}>今天</span>}
            </div>
            {timeline.length === 0
              ? <div style={S.empty}>沒有事件</div>
              : <TimelineItems timeline={timeline} categories={categories} />}
          </div>
        );
      })}
    </div>
  );
}
