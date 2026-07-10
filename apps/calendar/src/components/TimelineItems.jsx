// 三個檢視共用的時間軸渲染：Day/Week/Month 都用 <TimelineItems> 渲染整條清單。
// 2026-07-10 依設計稿改版為白卡版型（時間置頂、標題大字、＃注記 pill、分隔線、📍👤 資訊列），
// 原本的「紙張卡」與緊湊列版型退場。改這裡一次，三個檢視同時生效。
import React from 'react';
import { INTERVAL_UNIT_LABEL, formatDiaryTime, formatTime } from '../utils.js';
import { THEME, categoryAccentForTag } from '../theme.js';

const S = {
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  // 設計稿白卡：時間在頂端、內容區塊用固定間距往下疊。
  // 全天項目同一套版型，只是不顯示時間、底色改稍深的淺藍（跟計時白卡區分）
  card: { padding: '14px 16px', background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: THEME.radiusSm, display: 'flex', flexDirection: 'column', gap: 10 },
  allDayCard: { padding: '14px 16px', background: THEME.primarySoft, border: 'none', borderRadius: THEME.radiusSm, display: 'flex', flexDirection: 'column', gap: 10 },
  cardTime: { fontSize: 13, fontWeight: 700, color: THEME.textDark },
  entryTitle: { fontSize: 17, fontWeight: 700, color: THEME.textDark },
  eventTitleRow: { display: 'flex', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  note: { fontSize: 13.5, color: THEME.textMuted, lineHeight: 1.5, whiteSpace: 'pre-wrap' },
  hashtagsRow: { display: 'flex', flexWrap: 'wrap', gap: '4px 8px' },
  hashtagChip: { background: THEME.hashtagBg, color: THEME.hashtagInk, fontSize: 12.5, fontWeight: 600, padding: '4px 10px', borderRadius: 999 },
  divider: { height: 1, background: THEME.border },
  tagChip: { fontSize: 12.5, fontWeight: 600, color: THEME.textMuted, background: THEME.bg, padding: '4px 10px', borderRadius: 999 },
  tagsRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  meta: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px 14px', fontSize: 12.5, color: THEME.textMuted },
  // 標籤 chip 與 📍👤 資訊列同一行（放不下才換行）
  footerRow: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px 12px' },
  metaItem: { display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 },
  metaIcon: { fontSize: 11 },
  diaryEmpty: { fontSize: 13, color: THEME.textFaint },
  taskCard: { display: 'flex', gap: 10, alignItems: 'center', padding: 14, background: THEME.surfaceAlt, borderRadius: THEME.radiusSm, border: `1px dashed ${THEME.border}` },
  taskCheck: { fontSize: 15 },
  taskTitle: { fontSize: 15, fontWeight: 600, color: THEME.textDark },
  taskMeta: { fontSize: 12, color: THEME.textMuted, marginTop: 2 },
  tagChipWrap: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  diaryTagChip: (accent, onTint) => ({ fontSize: 11, fontWeight: 600, color: accent, background: onTint ? THEME.surface : THEME.primarySoft, padding: '3px 8px', borderRadius: 999 }),
};

// 日記標籤 chip（有填細節的顯示「標籤：細節」）。onTint=true 用在淺藍底的全天卡片上，
// chip 背景換成白色避免跟卡片同色被吃掉。
export function DiaryTags({ entry, categories, fallback, onTint = false }) {
  const tags = entry.tags || [];
  if (tags.length === 0) return fallback ?? null;
  return (
    <div style={S.tagChipWrap}>
      {tags.map((t) => (
        <span key={t} style={S.diaryTagChip(categoryAccentForTag(t, categories || []), onTint)}>
          {t}{entry.tag_details?.[t] ? `：${entry.tag_details[t]}` : ''}
        </span>
      ))}
    </div>
  );
}

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

// onEventClick/onDiaryClick/onTaskClick 選填：有傳項目才可點（Day/Month 用，直接進編輯）；
// 沒傳就純顯示（Week 用，整個日列本身已經可點跳日檢視）。
export default function TimelineItems({ timeline, categories, onEventClick, onDiaryClick, onTaskClick }) {
  const clickable = (handler) => handler
    ? { onClick: (e) => { e.stopPropagation(); handler(); }, style: { cursor: 'pointer' } }
    : { style: {} };

  return (
    <div style={S.list}>
      {timeline.map((item) => {
        if (item.kind === 'event') {
          const ev = item.data;
          const tags = ev.tags || [];
          const c = clickable(onEventClick && (() => onEventClick(ev)));
          return (
            <div key={`ev-${ev.id}`} style={{ ...(ev.all_day ? S.allDayCard : S.card), ...c.style }} onClick={c.onClick}>
              {!ev.all_day && <div style={S.cardTime}>{formatTime(ev.start_at)}</div>}
              <div>
                <div style={S.eventTitleRow}>
                  <span style={{ ...S.dot, background: ev.color || THEME.primary }} />
                  <span style={S.entryTitle}>{ev.title}</span>
                </div>
                {ev.description && <div style={{ ...S.note, marginTop: 4 }}>{ev.description}</div>}
              </div>
              {tags.length > 0 && (
                <div style={S.tagsRow}>
                  {tags.map((t) => (
                    <span key={t} style={{ ...S.tagChip, background: ev.all_day ? THEME.surface : THEME.bg }}>{t}</span>
                  ))}
                </div>
              )}
              <MetaRow locations={ev.location ? [ev.location] : []} people={ev.people} />
            </div>
          );
        }
        if (item.kind === 'task') {
          const t = item.data;
          const c = clickable(onTaskClick && (() => onTaskClick(t)));
          return (
            <div key={`task-${t.id}`} style={{ ...S.taskCard, ...c.style }} onClick={c.onClick}>
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
        const c = clickable(onDiaryClick && (() => onDiaryClick(entry)));
        const hasMeta = (entry.locations || []).length > 0 || (entry.people || []).length > 0;
        const hasContent = entry.title || entry.note || (entry.hashtags || []).length > 0;
        // 有內容（標題/文字描述/＃注記）的日記 → 設計稿主卡：
        // 時間、標題大字、note 小字、＃注記 pill，分隔線以下是標籤 chip 與地點/同伴
        if (hasContent) {
          return (
            <div key={`di-${entry.id}`} style={{ ...(entry.all_day ? S.allDayCard : S.card), ...c.style }} onClick={c.onClick}>
              {!entry.all_day && <div style={S.cardTime}>{formatDiaryTime(entry)}</div>}
              {(entry.title || entry.note) && (
                <div>
                  {entry.title && <div style={S.entryTitle}>{entry.title}</div>}
                  {entry.note && <div style={{ ...S.note, marginTop: entry.title ? 4 : 0 }}>{entry.note}</div>}
                </div>
              )}
              {(entry.hashtags || []).length > 0 && (
                <div style={S.hashtagsRow}>
                  {/* 全天卡底色跟 hashtagBg 同色，chip 換白底才不會被吃掉 */}
                  {entry.hashtags.map((h) => (
                    <span key={h} style={{ ...S.hashtagChip, background: entry.all_day ? THEME.surface : THEME.hashtagBg }}>#{h}</span>
                  ))}
                </div>
              )}
              {((entry.tags || []).length > 0 || hasMeta) && (
                <>
                  <div style={S.divider} />
                  <div style={S.footerRow}>
                    {(entry.tags || []).length > 0 && <DiaryTags entry={entry} categories={categories} onTint={!!entry.all_day} />}
                    <MetaRow locations={entry.locations} people={entry.people} />
                  </div>
                </>
              )}
            </div>
          );
        }
        // 沒內容的日記（純標籤打卡）：省略中段，只有時間 + 同一行的標籤 chip 與地點/同伴
        return (
          <div key={`di-${entry.id}`} style={{ ...(entry.all_day ? S.allDayCard : S.card), ...c.style }} onClick={c.onClick}>
            {!entry.all_day && <div style={S.cardTime}>{formatDiaryTime(entry)}</div>}
            <div style={S.footerRow}>
              <DiaryTags
                entry={entry}
                categories={categories}
                onTint={!!entry.all_day}
                fallback={<span style={S.diaryEmpty}>✎ 這則日記還沒有內容</span>}
              />
              <MetaRow locations={entry.locations} people={entry.people} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
