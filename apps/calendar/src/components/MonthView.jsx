// 月檢視：格線月曆，有事件的日期顯示小圓點，點日期跳去日檢視。
import React, { useMemo } from 'react';
import { DOW, dateKeyFrom, getMonthDays, monthLabel, parseDateKey, todayKey } from '../utils.js';

const S = {
  panel: { background: '#fff', borderRadius: 20, padding: 14, marginTop: 6, boxShadow: '0 6px 18px -12px rgba(74,111,165,.25)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { border: 'none', background: '#F5F7FA', color: '#4A6FA5', width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', fontSize: 18, fontWeight: 900, outline: 'none' },
  title: { fontSize: 16, fontWeight: 900, color: '#233A5E' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginTop: 12 },
  dow: { textAlign: 'center', fontSize: 11, fontWeight: 900, color: '#A9B4C6' },
  dayCell: { minHeight: 54, border: '1px solid #EEF1F6', borderRadius: 10, padding: '5px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', background: '#fff' },
  todayCell: { boxShadow: 'inset 0 0 0 2px rgba(74,111,165,.35)' },
  dayNum: { fontSize: 12, fontWeight: 800, color: '#233A5E' },
  dot: { width: 5, height: 5, borderRadius: '50%', background: '#4A6FA5' },
};

export default function MonthView({ anchorKey, onAnchorChange, eventsByDate, onSelectDay }) {
  const anchor = parseDateKey(anchorKey);
  const monthDays = useMemo(() => getMonthDays(anchor.getFullYear(), anchor.getMonth()), [anchor]);

  const shiftMonth = (delta) => {
    const next = new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1);
    onAnchorChange(dateKeyFrom(next));
  };

  return (
    <div style={S.panel}>
      <div style={S.header}>
        <button type="button" onClick={() => shiftMonth(-1)} style={S.navBtn} aria-label="上一個月">‹</button>
        <div style={S.title}>{monthLabel(anchor.getFullYear(), anchor.getMonth())}</div>
        <button type="button" onClick={() => shiftMonth(1)} style={S.navBtn} aria-label="下一個月">›</button>
      </div>

      <div style={S.grid}>
        {DOW.map((d) => <div key={d} style={S.dow}>{d}</div>)}
        {monthDays.map((dateKey, idx) => {
          if (!dateKey) return <div key={`empty-${idx}`} />;
          const date = parseDateKey(dateKey);
          const dayEvents = eventsByDate[dateKey] || [];
          const isToday = dateKey === todayKey();
          return (
            <div
              key={dateKey}
              style={{ ...S.dayCell, ...(isToday ? S.todayCell : {}) }}
              onClick={() => onSelectDay(dateKey)}
            >
              <span style={S.dayNum}>{date.getDate()}</span>
              {dayEvents.length > 0 && <span style={S.dot} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
