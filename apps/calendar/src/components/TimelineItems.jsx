// 三個檢視共用的時間軸小元件：Week/Month 用 <TimelineItems> 渲染整條清單，
// DayView（卡片版型不同）只共用 metaLine / DiaryTags。改這裡一次，三個檢視同時生效。
import React from 'react';
import { formatDiaryTime, formatTime } from '../utils.js';
import { DIARY_SERIF, THEME, categoryAccentForTag } from '../theme.js';

export const ROW = {
  item: { padding: '3px 0' },
  row: { display: 'flex', gap: 8, fontSize: 13, alignItems: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0, alignSelf: 'center' },
  taskDot: { width: 8, height: 8, borderRadius: 1, background: THEME.textMuted, flexShrink: 0, alignSelf: 'center' },
  time: { color: THEME.textMuted, width: 78, flexShrink: 0, whiteSpace: 'nowrap', alignSelf: 'center' },
  title: { color: THEME.textDark, alignSelf: 'center' },
  meta: (indent = 102) => ({ fontSize: 11, color: THEME.textMuted, marginLeft: indent }),
  metaInline: { fontSize: 11, color: THEME.textMuted, alignSelf: 'center' },
  tagChipWrap: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  diaryTagChip: (accent, onTint) => ({ fontSize: 11, fontWeight: 600, color: accent, background: onTint ? THEME.surface : THEME.primarySoft, padding: '3px 8px', borderRadius: 999 }),
  paperItem: { margin: '4px 0', padding: '10px 12px 8px', background: THEME.paper, border: `1px solid ${THEME.paperBorder}`, borderRadius: 10 },
  paperTime: { textAlign: 'center', fontSize: 10, letterSpacing: 2, color: THEME.paperMuted, marginBottom: 4 },
  paperNote: { fontFamily: DIARY_SERIF, fontSize: 13, lineHeight: 1.8, color: THEME.paperInk, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  paperHashtags: { display: 'flex', flexWrap: 'wrap', gap: '2px 8px', marginTop: 4, fontSize: 12, fontWeight: 600, color: THEME.hashtagInk },
  paperFooter: { marginTop: 6, paddingTop: 6, borderTop: `1px dashed ${THEME.paperDivider}`, display: 'flex', flexDirection: 'column', gap: 4 },
  paperMeta: { fontSize: 11, color: THEME.paperMuted },
};

// 📍 地點 · 👤 同伴 的一行小字（事件與日記共用）
export function metaLine(location, people) {
  const parts = [];
  if (location) parts.push(`📍 ${location}`);
  if (people && people.length > 0) parts.push(`👤 ${people.join('、')}`);
  return parts.length > 0 ? parts.join(' · ') : null;
}

// 日記標籤 chip（有填細節的顯示「標籤：細節」）。onTint=true 用在淺藍底的全天卡片上，
// chip 背景換成白色避免跟卡片同色被吃掉。
export function DiaryTags({ entry, categories, fallback, onTint = false }) {
  const tags = entry.tags || [];
  if (tags.length === 0) return fallback ?? <span style={ROW.title}>日記</span>;
  return (
    <div style={ROW.tagChipWrap}>
      {tags.map((t) => (
        <span key={t} style={ROW.diaryTagChip(categoryAccentForTag(t, categories || []), onTint)}>
          {t}{entry.tag_details?.[t] ? `：${entry.tag_details[t]}` : ''}
        </span>
      ))}
    </div>
  );
}

// Week 的每日列表、Month 的選中日摘要卡都是這一份。
// onEventClick/onDiaryClick/onTaskClick 選填：有傳項目才可點（Month 用，直接進編輯）；
// 沒傳就純顯示（Week 用，整個日列本身已經可點跳日檢視）。
export default function TimelineItems({ timeline, categories, onEventClick, onDiaryClick, onTaskClick }) {
  const clickable = (handler) => handler
    ? { onClick: (e) => { e.stopPropagation(); handler(); }, style: { cursor: 'pointer' } }
    : { style: {} };

  return timeline.map((item) => {
    if (item.kind === 'event') {
      const ev = item.data;
      const meta = metaLine(ev.location, ev.people);
      const c = clickable(onEventClick && (() => onEventClick(ev)));
      return (
        <div key={`ev-${ev.id}`} style={{ ...ROW.item, ...c.style }} onClick={c.onClick}>
          <div style={ROW.row}>
            <span style={{ ...ROW.dot, background: ev.color || THEME.primary }} />
            {!ev.all_day && <span style={ROW.time}>{formatTime(ev.start_at)}</span>}
            <span style={ROW.title}>{ev.title}</span>
          </div>
          {meta && <div style={ROW.meta(ev.all_day ? 16 : 102)}>{meta}</div>}
        </div>
      );
    }
    if (item.kind === 'diary') {
      const entry = item.data;
      const meta = metaLine((entry.locations || []).join('、'), entry.people);
      // 標籤最多一個時，地點/同伴小字直接接在標籤旁同一行；兩個以上才另起一行
      const metaInline = (entry.tags || []).length <= 1;
      const c = clickable(onDiaryClick && (() => onDiaryClick(entry)));
      // 有寫「今天的感覺」（文字描述或＃注記）→ 緊湊版紙張卡（跟 DayView 同一套視覺，文字截 2 行）
      if (entry.note || (entry.hashtags || []).length > 0) {
        return (
          <div key={`di-${entry.id}`} style={{ ...ROW.paperItem, ...c.style }} onClick={c.onClick}>
            <div style={ROW.paperTime}>✦&nbsp;&nbsp;{entry.all_day ? '全天' : formatDiaryTime(entry)}&nbsp;&nbsp;✦</div>
            {entry.note && <div style={ROW.paperNote}>{entry.note}</div>}
            {(entry.hashtags || []).length > 0 && (
              <div style={ROW.paperHashtags}>
                {entry.hashtags.map((h) => <span key={h}>＃{h}</span>)}
              </div>
            )}
            {((entry.tags || []).length > 0 || meta) && (
              <div style={ROW.paperFooter}>
                {(entry.tags || []).length > 0 && <DiaryTags entry={entry} categories={categories} onTint />}
                {meta && <div style={ROW.paperMeta}>{meta}</div>}
              </div>
            )}
          </div>
        );
      }
      return (
        <div key={`di-${entry.id}`} style={{ ...ROW.item, ...c.style }} onClick={c.onClick}>
          <div style={ROW.row}>
            {entry.all_day ? null : (
              <>
                <span style={{ ...ROW.dot, background: THEME.primaryDark }} />
                <span style={ROW.time}>{formatDiaryTime(entry)}</span>
              </>
            )}
            <DiaryTags entry={entry} categories={categories} />
            {metaInline && meta && <span style={ROW.metaInline}>{meta}</span>}
          </div>
          {!metaInline && meta && <div style={ROW.meta(entry.all_day ? 0 : 102)}>{meta}</div>}
        </div>
      );
    }
    const t = item.data;
    const c = clickable(onTaskClick && (() => onTaskClick(t)));
    return (
      <div key={`task-${t.id}`} style={{ ...ROW.item, ...c.style }} onClick={c.onClick}>
        <div style={ROW.row}>
          <span style={ROW.taskDot} />
          <span style={ROW.time}>☐</span>
          <span style={ROW.title}>{t.title}</span>
        </div>
      </div>
    );
  });
}
