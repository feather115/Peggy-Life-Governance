// 月檢視：格線月曆（有事件/日記的日期顯示顏色小圓點）+ 下方選中日期的摘要卡。
// 點日期只會「選中」該天並更新摘要卡，不會離開月檢視；點摘要卡標題才會跳去日檢視（onOpenDay）。
import React, { useMemo } from 'react';
import { DOW, buildDayTimeline, dateKeyFrom, formatDiaryTime, formatTime, getMonthDays, monthLabel, parseDateKey, todayKey } from '../utils.js';
import { THEME, categoryAccentForTag } from '../theme.js';

const taskDotStyle = { width: 6, height: 6, borderRadius: 1, background: THEME.textMuted };

const S = {
  panel: { background: THEME.surface, borderRadius: THEME.radius, padding: 14, margin: '6px 20px 0', boxShadow: THEME.shadow },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: THEME.textMuted, padding: '4px 10px', outline: 'none' },
  title: { fontSize: 16, fontWeight: 700, color: THEME.textDark },
  legend: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 4px 8px' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 5 },
  legendDot: { width: 6, height: 6, borderRadius: '50%' },
  legendLabel: { fontSize: 11, color: THEME.textMuted },
  dowRow: { display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', padding: '8px 2px 2px', textAlign: 'center' },
  dow: { fontSize: 12, color: THEME.textFaint, fontWeight: 600, paddingBottom: 6 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, paddingBottom: 4 },
  dayCell: { cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 46, borderRadius: THEME.radiusSm, padding: '4px 0' },
  badge: { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 },
  dotsRow: { display: 'flex', gap: 3, alignItems: 'center', height: 6 },
  dot: { width: 6, height: 6, borderRadius: '50%' },
};

const DetailCardStyle = {
  card: { margin: '16px 20px 20px', background: THEME.surface, borderRadius: THEME.radius, boxShadow: THEME.shadow, overflow: 'hidden' },
  cardHeader: { cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${THEME.border}` },
  cardHeaderLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  cardHeaderTitle: { fontSize: 14, fontWeight: 700, color: THEME.textDark },
  todayBadge: { fontSize: 11, fontWeight: 700, color: '#fff', background: THEME.primary, padding: '2px 7px', borderRadius: 999 },
  cardHeaderLink: { fontSize: 13, color: THEME.primary, fontWeight: 600 },
  cardBody: { padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 },
  empty: { fontSize: 13, color: THEME.textFaint, padding: '8px 0' },
  item: { padding: '2px 0' },
  itemRow: { display: 'flex', gap: 8, fontSize: 13, alignItems: 'flex-start' },
  itemDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0, alignSelf: 'center' },
  itemTime: { color: THEME.textMuted, width: 78, flexShrink: 0, whiteSpace: 'nowrap', alignSelf: 'center' },
  itemTitle: { color: THEME.textDark, alignSelf: 'center' },
  itemMeta: (indent = 102) => ({ fontSize: 11, color: THEME.textMuted, marginLeft: indent }),
  tagChipWrap: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  diaryTagChip: (accent) => ({ fontSize: 11, fontWeight: 600, color: accent, background: THEME.primarySoft, padding: '3px 8px', borderRadius: 999 }),
};

function metaLine(location, people) {
  const parts = [];
  if (location) parts.push(`📍 ${location}`);
  if (people && people.length > 0) parts.push(`👤 ${people.join('、')}`);
  return parts.length > 0 ? parts.join(' · ') : null;
}

// 日記標籤用框框（chip）顯示，跟 DayView 一致，不是純文字用頓號接起來
function DiaryTags({ entry, categories }) {
  const tags = entry.tags || [];
  if (tags.length === 0) return <span style={DetailCardStyle.itemTitle}>日記</span>;
  return (
    <div style={DetailCardStyle.tagChipWrap}>
      {tags.map((t) => (
        <span key={t} style={DetailCardStyle.diaryTagChip(categoryAccentForTag(t, categories || []))}>
          {t}{entry.tag_details?.[t] ? `：${entry.tag_details[t]}` : ''}
        </span>
      ))}
    </div>
  );
}

export default function MonthView({ anchorKey, onAnchorChange, selectedDateKey, onSelectDay, onOpenDay, eventsByDate, entriesByDate, categories, tasksByDueDate }) {
  const anchor = parseDateKey(anchorKey);
  const monthDays = useMemo(() => getMonthDays(anchor.getFullYear(), anchor.getMonth()), [anchor]);

  const shiftMonth = (delta) => {
    const next = new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1);
    onAnchorChange(dateKeyFrom(next));
  };

  const today = todayKey();
  const selectedDate = parseDateKey(selectedDateKey);
  const selectedTimeline = buildDayTimeline(eventsByDate[selectedDateKey], entriesByDate?.[selectedDateKey], tasksByDueDate?.[selectedDateKey]);
  const isSelectedToday = selectedDateKey === today;

  return (
    <>
      <div style={S.panel}>
        <div style={S.header}>
          <button type="button" onClick={() => shiftMonth(-1)} style={S.navBtn} aria-label="上一個月">‹</button>
          <div style={S.title}>{monthLabel(anchor.getFullYear(), anchor.getMonth())}</div>
          <button type="button" onClick={() => shiftMonth(1)} style={S.navBtn} aria-label="下一個月">›</button>
        </div>

        <div style={S.legend}>
          <div style={S.legendItem}>
            <span style={{ ...S.legendDot, background: THEME.primary }} />
            <span style={S.legendLabel}>事件</span>
          </div>
          <div style={S.legendItem}>
            <span style={{ ...S.legendDot, background: THEME.primaryDark }} />
            <span style={S.legendLabel}>日記</span>
          </div>
          <div style={S.legendItem}>
            <span style={taskDotStyle} />
            <span style={S.legendLabel}>任務</span>
          </div>
        </div>

        <div style={S.dowRow}>
          {DOW.map((d) => <div key={d} style={S.dow}>{d}</div>)}
        </div>

        <div style={S.grid}>
          {monthDays.map((dateKey, idx) => {
            if (!dateKey) return <div key={`empty-${idx}`} />;
            const date = parseDateKey(dateKey);
            const dayEvents = eventsByDate[dateKey] || [];
            const hasDiary = ((entriesByDate && entriesByDate[dateKey]) || []).length > 0;
            const hasTaskDue = ((tasksByDueDate && tasksByDueDate[dateKey]) || []).length > 0;
            const isToday = dateKey === today;
            const isSelected = dateKey === selectedDateKey;

            const dotColors = [];
            dayEvents.forEach((ev) => {
              const c = ev.color || THEME.primary;
              if (!dotColors.includes(c)) dotColors.push(c);
            });

            return (
              <div
                key={dateKey}
                style={{ ...S.dayCell, background: isSelected && !isToday ? THEME.primarySoft : 'transparent' }}
                onClick={() => onSelectDay(dateKey)}
              >
                <div style={{
                  ...S.badge,
                  fontWeight: isToday ? 700 : 500,
                  background: isToday ? THEME.primary : 'transparent',
                  color: isToday ? '#fff' : THEME.textDark,
                }}>
                  {date.getDate()}
                </div>
                <div style={S.dotsRow}>
                  {dotColors.slice(0, 3).map((c) => (
                    <span key={c} style={{ ...S.dot, background: c }} />
                  ))}
                  {hasDiary && <span style={{ ...S.dot, background: THEME.primaryDark }} />}
                  {hasTaskDue && <span style={taskDotStyle} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={DetailCardStyle.card}>
        <div style={DetailCardStyle.cardHeader} onClick={() => onOpenDay(selectedDateKey)}>
          <div style={DetailCardStyle.cardHeaderLeft}>
            <div style={DetailCardStyle.cardHeaderTitle}>{selectedDate.getMonth() + 1}月{selectedDate.getDate()}日 週{DOW[selectedDate.getDay()]}</div>
            {isSelectedToday && <span style={DetailCardStyle.todayBadge}>今天</span>}
          </div>
          <div style={DetailCardStyle.cardHeaderLink}>完整檢視 ›</div>
        </div>
        <div style={DetailCardStyle.cardBody}>
          {selectedTimeline.length === 0 ? (
            <div style={DetailCardStyle.empty}>這天還沒有記錄</div>
          ) : selectedTimeline.map((item) => {
            if (item.kind === 'event') {
              const ev = item.data;
              const meta = metaLine(ev.location, null);
              return (
                <div key={`ev-${ev.id}`} style={DetailCardStyle.item}>
                  <div style={DetailCardStyle.itemRow}>
                    <span style={{ ...DetailCardStyle.itemDot, background: ev.color || THEME.primary }} />
                    {!ev.all_day && <span style={DetailCardStyle.itemTime}>{formatTime(ev.start_at)}</span>}
                    <span style={DetailCardStyle.itemTitle}>{ev.title}</span>
                  </div>
                  {meta && <div style={DetailCardStyle.itemMeta(ev.all_day ? 16 : 102)}>{meta}</div>}
                </div>
              );
            }
            if (item.kind === 'diary') {
              const entry = item.data;
              const meta = metaLine(entry.location, entry.people);
              return (
                <div key={`di-${entry.id}`} style={DetailCardStyle.item}>
                  <div style={DetailCardStyle.itemRow}>
                    {entry.all_day ? null : (
                      <>
                        <span style={{ ...DetailCardStyle.itemDot, background: THEME.primaryDark }} />
                        <span style={DetailCardStyle.itemTime}>{formatDiaryTime(entry)}</span>
                      </>
                    )}
                    <DiaryTags entry={entry} categories={categories} />
                  </div>
                  {meta && <div style={DetailCardStyle.itemMeta(entry.all_day ? 0 : 102)}>{meta}</div>}
                </div>
              );
            }
            const t = item.data;
            return (
              <div key={`task-${t.id}`} style={DetailCardStyle.item}>
                <div style={DetailCardStyle.itemRow}>
                  <span style={{ width: 8, height: 8, borderRadius: 1, background: THEME.textMuted, flexShrink: 0 }} />
                  <span style={DetailCardStyle.itemTime}>☐</span>
                  <span style={DetailCardStyle.itemTitle}>{t.title}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
