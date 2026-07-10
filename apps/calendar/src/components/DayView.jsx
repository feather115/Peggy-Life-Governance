// 日檢視：單日事件 + 日記合併時間軸，可切換前一天/後一天，底部有「新增事件」「新增日記」按鈕。
// 2026-07-10 依設計稿改版：有時間的項目一律用白底邊框卡，時間獨立放卡片頂端，
// 日記標題（title）大字、note 小字灰色、＃注記 pill、虛線改實線分隔線、地點一個一個 📍 列。
import React from 'react';
import { INTERVAL_UNIT_LABEL, buildDayTimeline, dayLabel, formatDiaryTime, formatTime } from '../utils.js';
import { THEME } from '../theme.js';
import { DiaryTags } from './TimelineItems.jsx';

const S = {
  wrap: { display: 'flex', flexDirection: 'column', minHeight: '100%' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 10px' },
  navBtn: { border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: THEME.textMuted, padding: '4px 10px', outline: 'none' },
  title: { fontSize: 16, fontWeight: 700, color: THEME.textDark },
  list: { flex: 1, padding: '4px 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 },
  // 設計稿白卡：時間在頂端、內容區塊用固定間距往下疊
  card: { cursor: 'pointer', padding: '14px 16px', background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: THEME.radiusSm, display: 'flex', flexDirection: 'column', gap: 10 },
  cardTime: { fontSize: 13, fontWeight: 700, color: THEME.textDark },
  entryTitle: { fontSize: 17, fontWeight: 700, color: THEME.textDark },
  eventTitleRow: { display: 'flex', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  note: { fontSize: 13.5, color: THEME.textMuted, lineHeight: 1.5, marginTop: 4 },
  hashtagsRow: { display: 'flex', flexWrap: 'wrap', gap: '4px 8px' },
  hashtagChip: { background: THEME.hashtagBg, color: THEME.hashtagInk, fontSize: 12.5, fontWeight: 600, padding: '4px 10px', borderRadius: 999 },
  divider: { height: 1, background: THEME.border },
  tagChip: { fontSize: 12.5, fontWeight: 600, color: THEME.textMuted, background: THEME.bg, padding: '4px 10px', borderRadius: 999 },
  tagsRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  meta: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px 14px', fontSize: 12.5, color: THEME.textMuted },
  metaItem: { display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 },
  metaIcon: { fontSize: 11 },
  diaryEmpty: { fontSize: 13, color: THEME.textFaint },
  // 全天卡片維持原樣（淺藍底）
  allDayCard: { cursor: 'pointer', padding: 14, background: THEME.primarySoft, borderRadius: THEME.radiusSm },
  allDayTop: { display: 'flex', gap: 10, alignItems: 'center' },
  allDayTitle: { fontSize: 15, fontWeight: 600, color: THEME.textDark },
  allDayDesc: { fontSize: 13, color: THEME.textMuted, marginTop: 4, marginLeft: 18, lineHeight: 1.5 },
  allDayTagsRow: { display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6, marginLeft: 18 },
  allDayTagChip: { fontSize: 11, fontWeight: 600, color: THEME.textMuted, background: THEME.surface, padding: '3px 8px', borderRadius: 999 },
  allDayDiaryMeta: { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6, fontSize: 12, color: THEME.textMuted },
  diaryMetaInline: { display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: THEME.textMuted, alignSelf: 'center' },
  taskCard: { cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', padding: 14, background: THEME.surfaceAlt, borderRadius: THEME.radiusSm, border: `1px dashed ${THEME.border}` },
  taskCheck: { fontSize: 15 },
  taskTitle: { fontSize: 15, fontWeight: 600, color: THEME.textDark },
  taskMeta: { fontSize: 12, color: THEME.textMuted, marginTop: 2 },
  empty: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', fontSize: 14, color: THEME.textFaint },
  footer: { position: 'sticky', bottom: 0, padding: '14px 20px calc(14px + env(safe-area-inset-bottom))', background: THEME.bg, display: 'flex', gap: 10 },
  addEventBtn: { flex: 1, border: 'none', cursor: 'pointer', padding: 13, borderRadius: THEME.radiusSm, background: THEME.primary, color: '#fff', fontSize: 15, fontWeight: 700, outline: 'none' },
  addDiaryBtn: { flex: 1, border: `1px solid ${THEME.primary}`, cursor: 'pointer', padding: 13, borderRadius: THEME.radiusSm, background: THEME.surface, color: THEME.primary, fontSize: 15, fontWeight: 700, outline: 'none' },
};

// 📍 一個地點一個 span、👤 同伴合併一個 span（設計稿的底部資訊列）
function MetaRow({ locations, people }) {
  const locs = locations || [];
  const ppl = people || [];
  if (locs.length === 0 && ppl.length === 0) return null;
  return (
    <div style={S.meta}>
      {locs.map((loc) => (
        <span key={loc} style={S.metaItem}><span style={S.metaIcon}>📍</span>{loc}</span>
      ))}
      {ppl.length > 0 && (
        <span style={S.metaItem}><span style={S.metaIcon}>👤</span>{ppl.slice(0, 3).join('、')}{ppl.length > 3 ? ` +${ppl.length - 3}` : ''}</span>
      )}
    </div>
  );
}

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
                    <span style={S.allDayTitle}>{ev.title}</span>
                  </div>
                  {ev.location && <div style={S.allDayDesc}>📍 {ev.location}</div>}
                  {(ev.people || []).length > 0 && <div style={S.allDayDesc}>👤 {ev.people.join('、')}</div>}
                  {ev.description && <div style={S.allDayDesc}>{ev.description}</div>}
                  {tags.length > 0 && (
                    <div style={S.allDayTagsRow}>
                      {tags.map((t) => <span key={t} style={S.allDayTagChip}>{t}</span>)}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <div key={`ev-${ev.id}`} style={S.card} onClick={() => onEdit(ev)}>
                <div style={S.cardTime}>{formatTime(ev.start_at)}</div>
                <div>
                  <div style={S.eventTitleRow}>
                    <span style={{ ...S.dot, background: ev.color || THEME.primary }} />
                    <span style={S.entryTitle}>{ev.title}</span>
                  </div>
                  {ev.description && <div style={S.note}>{ev.description}</div>}
                </div>
                {tags.length > 0 && (
                  <div style={S.tagsRow}>
                    {tags.map((t) => <span key={t} style={S.tagChip}>{t}</span>)}
                  </div>
                )}
                <MetaRow locations={ev.location ? [ev.location] : []} people={ev.people} />
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
          const hasContent = entry.title || entry.note || (entry.hashtags || []).length > 0;
          // 有內容（標題/文字描述/＃注記）的日記 → 設計稿主卡：
          // 時間、標題大字、note 小字、＃注記 pill，分隔線以下是標籤 chip 與地點/同伴
          if (hasContent) {
            return (
              <div key={`di-${entry.id}`} style={S.card} onClick={() => onEditDiary(entry)}>
                <div style={S.cardTime}>{formatDiaryTime(entry)}</div>
                {(entry.title || entry.note) && (
                  <div>
                    {entry.title && <div style={S.entryTitle}>{entry.title}</div>}
                    {entry.note && <div style={{ ...S.note, marginTop: entry.title ? 4 : 0 }}>{entry.note}</div>}
                  </div>
                )}
                {(entry.hashtags || []).length > 0 && (
                  <div style={S.hashtagsRow}>
                    {entry.hashtags.map((h) => <span key={h} style={S.hashtagChip}>#{h}</span>)}
                  </div>
                )}
                {((entry.tags || []).length > 0 || hasMeta) && (
                  <>
                    <div style={S.divider} />
                    {(entry.tags || []).length > 0 && <DiaryTags entry={entry} categories={categories} />}
                    <MetaRow locations={entry.locations} people={entry.people} />
                  </>
                )}
              </div>
            );
          }
          // 沒內容的日記：全天維持淺藍卡，其餘用白卡（時間 + 標籤 chip + 地點/同伴）
          const renderTags = () => (
            <DiaryTags
              entry={entry}
              categories={categories}
              onTint={!!entry.all_day}
              fallback={<span style={S.diaryEmpty}>✎ 這則日記還沒有內容</span>}
            />
          );
          if (entry.all_day) {
            const metaSpans = hasMeta && (
              <>
                {(entry.locations || []).length > 0 && <span>📍 {entry.locations.join('、')}</span>}
                {(entry.people || []).length > 0 && <span>👤 {entry.people.slice(0, 3).join('、')}{entry.people.length > 3 ? ` +${entry.people.length - 3}` : ''}</span>}
              </>
            );
            // 標籤最多一個時，地點/同伴直接接在標籤旁同一行；兩個以上才另起一行
            const metaInline = (entry.tags || []).length <= 1;
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
              <div style={S.cardTime}>{formatDiaryTime(entry)}</div>
              {renderTags()}
              <MetaRow locations={entry.locations} people={entry.people} />
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
