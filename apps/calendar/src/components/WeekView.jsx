// 週檢視：一週 7 天直向列表，每天下面列出當天事件，點某一天跳去日檢視。
import React, { useMemo } from 'react';
import { DOW, dateKeyFrom, formatTime, getWeekDays, parseDateKey, todayKey, weekRangeLabel } from '../utils.js';

const S = {
  panel: { background: '#fff', borderRadius: 20, padding: 14, marginTop: 6, boxShadow: '0 6px 18px -12px rgba(74,111,165,.25)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { border: 'none', background: '#F5F7FA', color: '#4A6FA5', width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', fontSize: 18, fontWeight: 900, outline: 'none' },
  title: { fontSize: 15, fontWeight: 900, color: '#233A5E' },
  dayRow: { borderTop: '1px solid #EEF1F6', padding: '10px 4px', cursor: 'pointer' },
  dayHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  dayLabel: { fontSize: 13, fontWeight: 900, color: '#233A5E' },
  todayBadge: { fontSize: 10, fontWeight: 900, color: '#4A6FA5', background: '#EFF3FA', padding: '2px 6px', borderRadius: 8 },
  eventChip: { fontSize: 12, color: '#4A6FA5', fontWeight: 700, marginTop: 2 },
  empty: { fontSize: 12, color: '#C3CAD8', fontWeight: 700 },
};

export default function WeekView({ anchorKey, onAnchorChange, eventsByDate, onSelectDay }) {
  const anchor = parseDateKey(anchorKey);
  const weekDays = useMemo(() => getWeekDays(anchor), [anchor]);

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
        const dayEvents = eventsByDate[dateKey] || [];
        const isToday = dateKey === todayKey();
        return (
          <div key={dateKey} style={S.dayRow} onClick={() => onSelectDay(dateKey)}>
            <div style={S.dayHeader}>
              <span style={S.dayLabel}>{date.getMonth() + 1}/{date.getDate()}（{DOW[date.getDay()]}）</span>
              {isToday && <span style={S.todayBadge}>今天</span>}
            </div>
            {dayEvents.length === 0
              ? <div style={S.empty}>沒有事件</div>
              : dayEvents.map((ev) => (
                <div key={ev.id} style={S.eventChip}>
                  {ev.all_day ? '全天' : formatTime(ev.start_at)} · {ev.title}
                </div>
              ))}
          </div>
        );
      })}
    </div>
  );
}
