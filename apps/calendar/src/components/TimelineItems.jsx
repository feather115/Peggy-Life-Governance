// 三個檢視共用的時間軸渲染：Day/Week/Month 都用 <TimelineItems> 渲染整條清單。
// 版面是「白卡裡的一列一列」（外層卡片由各檢視提供，列之間細線分隔）：左欄時間（全天紀錄左欄留空——使用者反映
// 在時間位置寫「全天」很生硬；任務在左欄放勾選圓圈），
// 右欄是標題（標題前刻意不放顏色圓點），下面依序疊備註、＃注記、選項庫標籤、分類標籤、地點/同伴——有什麼顯示什麼。
// 事件與日記合併後只剩兩種項目：紀錄（record）與任務（task）。改這裡一次，三個檢視同時生效。
import React, { useState } from 'react';
import { INTERVAL_UNIT_LABEL, formatTime } from '../utils.js';
import { THEME, categoryAccentForTag } from '../theme.js';
import TaskCompleteRow from './TaskCompleteRow.jsx';
import Icon from '@peggy-life/shared/Icon.jsx';
import { UI } from '@peggy-life/shared/ui';

const S = {
  row: { width: '100%', display: 'flex', gap: 12, padding: '14px 16px', border: 'none', background: 'none', textAlign: 'left', color: THEME.textDark },
  divider: { height: 1, background: THEME.border, marginLeft: 72 },
  timeCol: { width: 44, flex: 'none', paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2, fontSize: 13, fontWeight: 500, color: THEME.textMuted, ...UI.num },
  timeEnd: { fontSize: 12, fontWeight: 400, color: THEME.textFaint },
  body: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 },
  entryTitle: { fontSize: 15, fontWeight: 500, color: THEME.textDark },
  note: { fontSize: 14, color: THEME.textMuted, lineHeight: 1.5, whiteSpace: 'pre-wrap' },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  hashtagChip: { ...UI.tag('primary'), color: THEME.hashtagInk },
  tagChip: UI.tag('neutral'),
  diaryTagChip: (accent) => ({ ...UI.tag('neutral'), color: accent }),
  meta: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px 12px', fontSize: 13, color: THEME.textMuted },
  metaItem: { display: 'inline-flex', alignItems: 'center', gap: 4 },
  empty: { fontSize: 13, color: THEME.textFaint, display: 'flex', alignItems: 'center', gap: 4 },
  taskWrap: { padding: '12px 16px' },
  taskRow: { display: 'flex', gap: 12, alignItems: 'center' },
  taskCheckCol: { width: 44, flex: 'none', display: 'flex' },
  taskCheck: (active) => ({ width: 24, height: 24, flex: 'none', padding: 0, borderRadius: 999, border: `2px solid ${THEME.primaryInk}`, background: active ? THEME.primarySoft : THEME.surface }),
  taskMain: { flex: 1, minWidth: 0, padding: 0, border: 'none', background: 'none', color: 'inherit', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2 },
  taskTitle: { fontSize: 15, fontWeight: 500, color: THEME.textDark },
  taskMeta: { fontSize: 13, color: THEME.textMuted },
};

// 分類標籤 chip（有填細節的顯示「標籤：細節」），字色依所屬分類
export function DiaryTags({ record, categories, fallback }) {
  const tags = record.diary_tags || [];
  if (tags.length === 0) return fallback ?? null;
  return (
    <div style={S.chips}>
      {tags.map((t) => (
        <span key={t} style={S.diaryTagChip(categoryAccentForTag(t, categories || []))}>
          {t}{record.tag_details?.[t] ? `：${record.tag_details[t]}` : ''}
        </span>
      ))}
    </div>
  );
}

// 地點一個一個 span、同伴全部合併在一個 span；圖示用線條 icon（emoji 在各平台長得不一樣）
function MetaRow({ locations, people }) {
  const locs = locations || [];
  const ppl = people || [];
  if (locs.length === 0 && ppl.length === 0) return null;
  return (
    <div style={S.meta}>
      {locs.map((loc) => (
        <span key={loc} style={S.metaItem}><Icon name="map-pin" size={14} />{loc}</span>
      ))}
      {ppl.length > 0 && (
        <span style={S.metaItem}><Icon name="user" size={14} />{ppl.join(', ')}</span>
      )}
    </div>
  );
}

// onRecordClick/onTaskClick/onTaskComplete 選填：有傳才可點。紀錄列點了進編輯；任務列點標題進編輯、
// 點左邊圓圈在原地展開「標記完成」。三個檢視（月/週/日）傳一樣的 handler，點同一種項目行為都一樣。
export default function TimelineItems({ timeline, categories, onRecordClick, onTaskClick, onTaskComplete }) {
  const [completingId, setCompletingId] = useState(null);

  return (
    <div>
      {timeline.map((item, index) => {
        const divider = index > 0 && <div style={S.divider} />;
        if (item.kind === 'task') {
          const t = item.data;
          const isCompleting = completingId === t.id;
          const Main = onTaskClick ? 'button' : 'div';
          return (
            <React.Fragment key={`task-${t.id}`}>
              {divider}
              <div style={S.taskWrap}>
                <div style={S.taskRow}>
                  <span style={S.taskCheckCol}>
                    {onTaskComplete ? (
                      <button type="button" className="tap" style={S.taskCheck(isCompleting)}
                        aria-label={`標記「${t.title}」完成`} aria-expanded={isCompleting}
                        onClick={() => setCompletingId(isCompleting ? null : t.id)} />
                    ) : (
                      <span style={S.taskCheck(false)} aria-hidden="true" />
                    )}
                  </span>
                  <Main {...(onTaskClick ? { type: 'button', onClick: () => onTaskClick(t) } : {})} style={S.taskMain}>
                    <span style={S.taskTitle}>{t.title}</span>
                    <span style={S.taskMeta}>任務 · 每 {t.interval_value}{INTERVAL_UNIT_LABEL[t.interval_unit]}一次</span>
                  </Main>
                </div>
                {isCompleting && (
                  <TaskCompleteRow
                    onConfirm={async (date) => { await onTaskComplete(t, date); setCompletingId(null); }}
                    onCancel={() => setCompletingId(null)}
                  />
                )}
              </div>
            </React.Fragment>
          );
        }
        // record（事件+日記合併後的單一項目）
        const r = item.data;
        const Row = onRecordClick ? 'button' : 'div';
        const rowProps = onRecordClick ? { type: 'button', onClick: () => onRecordClick(r) } : {};
        const evTags = r.tags || [];
        const diaryTags = r.diary_tags || [];
        const hashtags = r.hashtags || [];
        const hasBody = r.title || r.description || r.note || hashtags.length > 0 || evTags.length > 0;
        const isEmpty = !hasBody && diaryTags.length === 0 && (r.locations || []).length === 0 && (r.people || []).length === 0;

        return (
          <React.Fragment key={`rec-${r.id}`}>
            {divider}
            <Row {...rowProps} style={S.row}>
              <span style={S.timeCol}>
                {!r.all_day && formatTime(r.start_at)}
                {!r.all_day && r.end_at && <span style={S.timeEnd}>{formatTime(r.end_at)}</span>}
              </span>
              <span style={S.body}>
                {r.title && <span style={S.entryTitle}>{r.title}</span>}
                {r.description && <span style={S.note}>{r.description}</span>}
                {r.note && <span style={S.note}>{r.note}</span>}
                {(hashtags.length > 0 || evTags.length > 0) && (
                  <span style={S.chips}>
                    {hashtags.map((h) => <span key={`h-${h}`} style={S.hashtagChip}>#{h}</span>)}
                    {evTags.map((t) => <span key={`t-${t}`} style={S.tagChip}>{t}</span>)}
                  </span>
                )}
                {diaryTags.length > 0 && <DiaryTags record={r} categories={categories} />}
                <MetaRow locations={r.locations} people={r.people} />
                {isEmpty && <span style={S.empty}><Icon name="pencil" size={14} />這則紀錄還沒有內容</span>}
              </span>
            </Row>
          </React.Fragment>
        );
      })}
    </div>
  );
}
