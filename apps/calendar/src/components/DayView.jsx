// 日檢視：單日事件列表，可切換前一天/後一天，點事件進編輯、底部有「新增事件」按鈕。
import React from 'react';
import { dateKeyFrom, dayLabel, formatTime, parseDateKey } from '../utils.js';

const S = {
  panel: { background: '#fff', borderRadius: 20, padding: 14, marginTop: 6, boxShadow: '0 6px 18px -12px rgba(74,111,165,.25)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { border: 'none', background: '#F5F7FA', color: '#4A6FA5', width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', fontSize: 18, fontWeight: 900, outline: 'none' },
  title: { fontSize: 14, fontWeight: 900, color: '#233A5E' },
  eventRow: { display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 4px', borderTop: '1px solid #EEF1F6', cursor: 'pointer' },
  time: { fontSize: 12, fontWeight: 900, color: '#4A6FA5', width: 46, flexShrink: 0 },
  eventTitle: { fontSize: 14, fontWeight: 800, color: '#233A5E' },
  eventDesc: { fontSize: 12, color: '#8792A6', marginTop: 2 },
  empty: { fontSize: 13, color: '#C3CAD8', fontWeight: 700, textAlign: 'center', padding: '24px 4px' },
  addBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', border: '1px dashed #4A6FA5', background: '#EFF3FA', color: '#4A6FA5', borderRadius: 14, padding: 12, fontSize: 13, fontWeight: 900, cursor: 'pointer', marginTop: 12, outline: 'none' },
};

export default function DayView({ anchorKey, onAnchorChange, eventsByDate, onEdit, onCreate }) {
  const date = parseDateKey(anchorKey);
  const dayEvents = eventsByDate[anchorKey] || [];

  const shiftDay = (delta) => {
    const next = new Date(date);
    next.setDate(next.getDate() + delta);
    onAnchorChange(dateKeyFrom(next));
  };

  return (
    <div style={S.panel}>
      <div style={S.header}>
        <button type="button" onClick={() => shiftDay(-1)} style={S.navBtn} aria-label="前一天">‹</button>
        <div style={S.title}>{dayLabel(anchorKey)}</div>
        <button type="button" onClick={() => shiftDay(1)} style={S.navBtn} aria-label="後一天">›</button>
      </div>

      {dayEvents.length === 0 ? (
        <div style={S.empty}>這天還沒有事件</div>
      ) : dayEvents.map((ev) => (
        <div key={ev.id} style={S.eventRow} onClick={() => onEdit(ev)}>
          <div style={S.time}>{ev.all_day ? '全天' : formatTime(ev.start_at)}</div>
          <div>
            <div style={S.eventTitle}>{ev.title}</div>
            {ev.description && <div style={S.eventDesc}>{ev.description}</div>}
          </div>
        </div>
      ))}

      <button type="button" style={S.addBtn} onClick={() => onCreate(anchorKey)}>＋ 新增事件</button>
    </div>
  );
}
