// 日檢視：單日事件 + 日記合併時間軸，可切換前一天/後一天，底部有「新增事件」「新增日記」按鈕。
import React from 'react';
import { buildDayTimeline, dayLabel, formatDiaryTime, formatTime } from '../utils.js';
import { THEME, categoryAccentForTag } from '../theme.js';

const S = {
  wrap: { display: 'flex', flexDirection: 'column', minHeight: '100%' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 10px' },
  navBtn: { border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: THEME.textMuted, padding: '4px 10px', outline: 'none' },
  title: { fontSize: 16, fontWeight: 700, color: THEME.textDark },
  list: { flex: 1, padding: '4px 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 },
  card: { cursor: 'pointer', padding: 14, background: THEME.surfaceAlt2, borderRadius: THEME.radiusSm },
  eventTop: { display: 'flex', gap: 10, alignItems: 'baseline' },
  dot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0, alignSelf: 'center' },
  time: { fontSize: 13, fontWeight: 600, color: THEME.primary, minWidth: 62 },
  eventTitle: { fontSize: 15, fontWeight: 600, color: THEME.textDark },
  desc: { fontSize: 13, color: THEME.textMuted, marginTop: 4, marginLeft: 80, lineHeight: 1.5 },
  tagsRow: { display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6, marginLeft: 80 },
  tagChip: { fontSize: 11, fontWeight: 600, color: THEME.textMuted, background: THEME.surface, padding: '3px 8px', borderRadius: 999 },
  diaryTagChip: (accent) => ({ fontSize: 11, fontWeight: 600, color: accent, background: THEME.primarySoft, padding: '3px 8px', borderRadius: 999 }),
  diaryTop: { display: 'flex', gap: 10, alignItems: 'baseline' },
  diaryTime: { fontSize: 13, fontWeight: 600, color: THEME.primary, minWidth: 70 },
  diaryEmpty: { fontSize: 13, color: THEME.textFaint },
  diaryMeta: { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6, marginLeft: 80, fontSize: 12, color: THEME.textMuted },
  diaryNote: { fontSize: 13, color: THEME.textMuted, lineHeight: 1.5, fontStyle: 'italic', marginTop: 6, marginLeft: 80 },
  empty: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', fontSize: 14, color: THEME.textFaint },
  footer: { position: 'sticky', bottom: 0, padding: '14px 20px calc(14px + env(safe-area-inset-bottom))', background: THEME.bg, display: 'flex', gap: 10 },
  addEventBtn: { flex: 1, border: 'none', cursor: 'pointer', padding: 13, borderRadius: THEME.radiusSm, background: THEME.primary, color: '#fff', fontSize: 15, fontWeight: 700, outline: 'none' },
  addDiaryBtn: { flex: 1, border: `1px solid ${THEME.primary}`, cursor: 'pointer', padding: 13, borderRadius: THEME.radiusSm, background: THEME.surface, color: THEME.primary, fontSize: 15, fontWeight: 700, outline: 'none' },
};

export default function DayView({ dateKey, onShiftDay, eventsByDate, entriesByDate, categories, onEdit, onCreate, onEditDiary, onCreateDiary }) {
  const dayEvents = eventsByDate[dateKey] || [];
  const dayEntries = (entriesByDate && entriesByDate[dateKey]) || [];
  const timeline = buildDayTimeline(dayEvents, dayEntries);

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
        ) : timeline.map((item) => {
          if (item.kind === 'event') {
            const ev = item.data;
            const tags = ev.tags || [];
            return (
              <div key={`ev-${ev.id}`} style={S.card} onClick={() => onEdit(ev)}>
                <div style={S.eventTop}>
                  <span style={{ ...S.dot, background: ev.color || THEME.primary }} />
                  <span style={S.time}>{ev.all_day ? '全天' : formatTime(ev.start_at)}</span>
                  <span style={S.eventTitle}>{ev.title}</span>
                </div>
                {ev.description && <div style={S.desc}>{ev.description}</div>}
                {tags.length > 0 && (
                  <div style={S.tagsRow}>
                    {tags.map((t) => <span key={t} style={S.tagChip}>{t}</span>)}
                  </div>
                )}
              </div>
            );
          }
          // diary
          const entry = item.data;
          const tags = entry.tags || [];
          const hasMeta = !!entry.location || (entry.people || []).length > 0;
          return (
            <div key={`di-${entry.id}`} style={S.card} onClick={() => onEditDiary(entry)}>
              <div style={S.diaryTop}>
                <span style={S.diaryTime}>{formatDiaryTime(entry)}</span>
                {tags.length === 0 ? (
                  <span style={S.diaryEmpty}>✎ 這則日記還沒有內容</span>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {tags.map((t) => (
                      <span key={t} style={S.diaryTagChip(categoryAccentForTag(t, categories || []))}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
              {hasMeta && (
                <div style={S.diaryMeta}>
                  {entry.location && <span>📍 {entry.location}</span>}
                  {(entry.people || []).length > 0 && <span>👤 {entry.people.slice(0, 3).join('、')}{entry.people.length > 3 ? ` +${entry.people.length - 3}` : ''}</span>}
                </div>
              )}
              {entry.note && <div style={S.diaryNote}>「{entry.note}」</div>}
            </div>
          );
        })}
      </div>

      <div style={S.footer}>
        <button type="button" style={S.addEventBtn} onClick={() => onCreate(dateKey)}>＋ 新增事件</button>
        <button type="button" style={S.addDiaryBtn} onClick={() => onCreateDiary(dateKey)}>＋ 新增日記</button>
      </div>
    </div>
  );
}
