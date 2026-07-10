// 日檢視：單日事件 + 日記合併時間軸，可切換前一天/後一天，底部有「新增事件」「新增日記」按鈕。
import React from 'react';
import { INTERVAL_UNIT_LABEL, buildDayTimeline, dayLabel, formatDiaryTime, formatTime } from '../utils.js';
import { DIARY_SERIF, THEME } from '../theme.js';
import { DiaryTags } from './TimelineItems.jsx';

const S = {
  wrap: { display: 'flex', flexDirection: 'column', minHeight: '100%' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 10px' },
  navBtn: { border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: THEME.textMuted, padding: '4px 10px', outline: 'none' },
  title: { fontSize: 16, fontWeight: 700, color: THEME.textDark },
  list: { flex: 1, padding: '4px 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 },
  card: { cursor: 'pointer', padding: 14, background: THEME.surfaceAlt2, borderRadius: THEME.radiusSm },
  allDayCard: { cursor: 'pointer', padding: 14, background: THEME.primarySoft, borderRadius: THEME.radiusSm },
  eventTop: { display: 'flex', gap: 10, alignItems: 'baseline' },
  allDayTop: { display: 'flex', gap: 10, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0, alignSelf: 'center' },
  time: { fontSize: 13, fontWeight: 600, color: THEME.primary, width: 78, flexShrink: 0, whiteSpace: 'nowrap' },
  eventTitle: { fontSize: 15, fontWeight: 600, color: THEME.textDark },
  desc: { fontSize: 13, color: THEME.textMuted, marginTop: 4, marginLeft: 80, lineHeight: 1.5 },
  allDayDesc: { fontSize: 13, color: THEME.textMuted, marginTop: 4, marginLeft: 18, lineHeight: 1.5 },
  tagsRow: { display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6, marginLeft: 80 },
  allDayTagsRow: { display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6, marginLeft: 18 },
  tagChip: { fontSize: 11, fontWeight: 600, color: THEME.textMuted, background: THEME.surface, padding: '3px 8px', borderRadius: 999 },
  diaryTop: { display: 'flex', gap: 10, alignItems: 'baseline' },
  diaryTime: { fontSize: 13, fontWeight: 600, color: THEME.primary, width: 78, flexShrink: 0, whiteSpace: 'nowrap' },
  diaryEmpty: { fontSize: 13, color: THEME.textFaint },
  diaryMeta: { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6, marginLeft: 80, fontSize: 12, color: THEME.textMuted },
  diaryMetaInline: { display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: THEME.textMuted, alignSelf: 'center' },
  allDayDiaryMeta: { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6, marginLeft: 0, fontSize: 12, color: THEME.textMuted },
  paperCard: { cursor: 'pointer', padding: '14px 16px 10px', background: THEME.paper, border: `1px solid ${THEME.paperBorder}`, borderRadius: THEME.radiusSm },
  paperTime: { textAlign: 'center', fontSize: 11, letterSpacing: 2, color: THEME.paperMuted, marginBottom: 8 },
  paperNote: { fontFamily: DIARY_SERIF, fontSize: 15, lineHeight: 2, color: THEME.paperInk, whiteSpace: 'pre-wrap' },
  paperHashtags: { display: 'flex', flexWrap: 'wrap', gap: '4px 10px', marginTop: 6, fontSize: 13, fontWeight: 600, color: THEME.hashtagInk },
  paperFooter: { marginTop: 10, paddingTop: 8, borderTop: `1px dashed ${THEME.paperDivider}`, display: 'flex', flexDirection: 'column', gap: 6 },
  paperMeta: { display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: THEME.paperMuted },
  taskCard: { cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', padding: 14, background: THEME.surfaceAlt, borderRadius: THEME.radiusSm, border: `1px dashed ${THEME.border}` },
  taskCheck: { fontSize: 15 },
  taskTitle: { fontSize: 15, fontWeight: 600, color: THEME.textDark },
  taskMeta: { fontSize: 12, color: THEME.textMuted, marginTop: 2 },
  empty: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', fontSize: 14, color: THEME.textFaint },
  footer: { position: 'sticky', bottom: 0, padding: '14px 20px calc(14px + env(safe-area-inset-bottom))', background: THEME.bg, display: 'flex', gap: 10 },
  addEventBtn: { flex: 1, border: 'none', cursor: 'pointer', padding: 13, borderRadius: THEME.radiusSm, background: THEME.primary, color: '#fff', fontSize: 15, fontWeight: 700, outline: 'none' },
  addDiaryBtn: { flex: 1, border: `1px solid ${THEME.primary}`, cursor: 'pointer', padding: 13, borderRadius: THEME.radiusSm, background: THEME.surface, color: THEME.primary, fontSize: 15, fontWeight: 700, outline: 'none' },
};

export default function DayView({ dateKey, onShiftDay, eventsByDate, entriesByDate, categories, tasksByDueDate, onEdit, onCreate, onEditDiary, onCreateDiary, onGoToTasks }) {
  const dayEvents = eventsByDate[dateKey] || [];
  const dayEntries = (entriesByDate && entriesByDate[dateKey]) || [];
  const dayTasks = (tasksByDueDate && tasksByDueDate[dateKey]) || [];
  const timeline = buildDayTimeline(dayEvents, dayEntries, dayTasks);

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
            if (ev.all_day) {
              return (
                <div key={`ev-${ev.id}`} style={S.allDayCard} onClick={() => onEdit(ev)}>
                  <div style={S.allDayTop}>
                    <span style={{ ...S.dot, background: ev.color || THEME.primary }} />
                    <span style={S.eventTitle}>{ev.title}</span>
                  </div>
                  {ev.location && <div style={S.allDayDesc}>📍 {ev.location}</div>}
                  {(ev.people || []).length > 0 && <div style={S.allDayDesc}>👤 {ev.people.join('、')}</div>}
                  {ev.description && <div style={S.allDayDesc}>{ev.description}</div>}
                  {tags.length > 0 && (
                    <div style={S.allDayTagsRow}>
                      {tags.map((t) => <span key={t} style={S.tagChip}>{t}</span>)}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <div key={`ev-${ev.id}`} style={S.card} onClick={() => onEdit(ev)}>
                <div style={S.eventTop}>
                  <span style={{ ...S.dot, background: ev.color || THEME.primary }} />
                  <span style={S.time}>{formatTime(ev.start_at)}</span>
                  <span style={S.eventTitle}>{ev.title}</span>
                </div>
                {ev.location && <div style={S.desc}>📍 {ev.location}</div>}
                {(ev.people || []).length > 0 && <div style={S.desc}>👤 {ev.people.join('、')}</div>}
                {ev.description && <div style={S.desc}>{ev.description}</div>}
                {tags.length > 0 && (
                  <div style={S.tagsRow}>
                    {tags.map((t) => <span key={t} style={S.tagChip}>{t}</span>)}
                  </div>
                )}
              </div>
            );
          }
          if (item.kind === 'task') {
            const t = item.data;
            return (
              <div key={`task-${t.id}`} style={S.taskCard} onClick={onGoToTasks}>
                <span style={S.taskCheck}>☐</span>
                <div>
                  <div style={S.taskTitle}>{t.title}</div>
                  <div style={S.taskMeta}>任務 · 每 {t.interval_value}{INTERVAL_UNIT_LABEL[t.interval_unit]}一次</div>
                </div>
              </div>
            );
          }
          // diary
          const entry = item.data;
          const hasMeta = (entry.locations || []).length > 0 || (entry.people || []).length > 0;
          // 標籤最多一個時，地點/同伴直接接在標籤旁同一行；兩個以上才另起一行
          const metaInline = (entry.tags || []).length <= 1;
          const metaSpans = hasMeta && (
            <>
              {(entry.locations || []).length > 0 && <span>📍 {entry.locations.join('、')}</span>}
              {(entry.people || []).length > 0 && <span>👤 {entry.people.slice(0, 3).join('、')}{entry.people.length > 3 ? ` +${entry.people.length - 3}` : ''}</span>}
            </>
          );
          const renderTags = () => (
            <DiaryTags
              entry={entry}
              categories={categories}
              onTint={!!entry.all_day}
              fallback={<span style={S.diaryEmpty}>✎ 這則日記還沒有內容</span>}
            />
          );
          // 有寫「今天的感覺」（文字描述或＃注記）→ 紙張卡：文字當主角、＃注記接在文末，
          // 標籤 chip 與地點/同伴收進虛線腳註
          if (entry.note || (entry.hashtags || []).length > 0) {
            return (
              <div key={`di-${entry.id}`} style={S.paperCard} onClick={() => onEditDiary(entry)}>
                <div style={S.paperTime}>✦&nbsp;&nbsp;{entry.all_day ? '全天' : formatDiaryTime(entry)}&nbsp;&nbsp;✦</div>
                {entry.note && <div style={S.paperNote}>{entry.note}</div>}
                {(entry.hashtags || []).length > 0 && (
                  <div style={S.paperHashtags}>
                    {entry.hashtags.map((h) => <span key={h}>＃{h}</span>)}
                  </div>
                )}
                {((entry.tags || []).length > 0 || hasMeta) && (
                  <div style={S.paperFooter}>
                    {(entry.tags || []).length > 0 && <DiaryTags entry={entry} categories={categories} onTint />}
                    {hasMeta && <div style={S.paperMeta}>{metaSpans}</div>}
                  </div>
                )}
              </div>
            );
          }
          if (entry.all_day) {
            return (
              <div key={`di-${entry.id}`} style={S.allDayCard} onClick={() => onEditDiary(entry)}>
                <div style={S.allDayTop}>
                  {renderTags()}
                  {metaInline && hasMeta && <div style={S.diaryMetaInline}>{metaSpans}</div>}
                </div>
                {!metaInline && hasMeta && <div style={S.allDayDiaryMeta}>{metaSpans}</div>}
              </div>
            );
          }
          return (
            <div key={`di-${entry.id}`} style={S.card} onClick={() => onEditDiary(entry)}>
              <div style={S.diaryTop}>
                <span style={S.diaryTime}>{formatDiaryTime(entry)}</span>
                {renderTags()}
                {metaInline && hasMeta && <div style={S.diaryMetaInline}>{metaSpans}</div>}
              </div>
              {!metaInline && hasMeta && <div style={S.diaryMeta}>{metaSpans}</div>}
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
