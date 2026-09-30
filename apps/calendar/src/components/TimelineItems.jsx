// 三個檢視共用的時間軸渲染：Day/Week/Month 都用 <TimelineItems> 渲染整條清單。
// 事件與日記合併後只剩兩種項目：紀錄（record）與任務（task）。一張紀錄卡把計畫面
// （標題+備註+選項庫標籤）與回顧面（今天的感覺+＃注記+分類標籤+地點/同伴）疊在一起，
// 有什麼顯示什麼。改這裡一次，三個檢視同時生效。
import React, { useState } from 'react';
import { INTERVAL_UNIT_LABEL, formatRecordTime } from '../utils.js';
import { THEME, categoryAccentForTag } from '../theme.js';
import TaskCompleteRow from './TaskCompleteRow.jsx';
import Icon from '@peggy-life/shared/Icon.jsx';

const S = {
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  // 設計稿白卡：時間在頂端、內容區塊用固定間距往下疊。
  // 全天項目同一套版型，只是不顯示時間、底色改稍深的淺藍（跟計時白卡區分）
  card: { padding: '14px 16px', background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: THEME.radiusSm, display: 'flex', flexDirection: 'column', gap: 10 },
  allDayCard: { padding: '14px 16px', background: THEME.primarySoft, border: 'none', borderRadius: THEME.radiusSm, display: 'flex', flexDirection: 'column', gap: 10 },
  cardTime: { fontSize: 13, fontWeight: 700, color: THEME.textDark },
  // 計時與全天卡的標題都維持 15px，避免全天標題過度突出
  entryTitle: { fontSize: 15, fontWeight: 700, color: THEME.textDark },
  titleRow: { display: 'flex', alignItems: 'center', gap: 8 },
  note: { fontSize: 14, color: THEME.textMuted, lineHeight: 1.5, whiteSpace: 'pre-wrap' },
  hashtagsRow: { display: 'flex', flexWrap: 'wrap', gap: '4px 8px' },
  hashtagChip: { background: THEME.hashtagBg, color: THEME.hashtagInk, fontSize: 13, fontWeight: 600, padding: '4px 10px', borderRadius: 999 },
  divider: { height: 1, background: THEME.border },
  tagChip: { fontSize: 13, fontWeight: 600, color: THEME.textMuted, background: THEME.bg, padding: '4px 10px', borderRadius: 999 },
  tagsRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  meta: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px 14px', fontSize: 13, color: THEME.textMuted },
  // 分類標籤 chip 與地點/同伴資訊列同一行（放不下才換行）
  footerRow: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px 12px' },
  metaItem: { display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 },
  empty: { fontSize: 13, color: THEME.textFaint },
  taskCard: { padding: '12px 14px', background: THEME.surfaceAlt, borderRadius: THEME.radiusSm, border: `1px dashed ${THEME.border}` },
  taskRow: { display: 'flex', gap: 12, alignItems: 'center' },
  // 圓形勾選框：點了展開「完成日期 + 確認完成」，不用跳到任務頁
  taskCheck: (active) => ({ width: 24, height: 24, flex: 'none', borderRadius: '50%', border: `2px solid ${THEME.primaryInk}`, background: active ? THEME.primarySoft : THEME.surface }),
  taskMain: { flex: 1, minWidth: 0, textAlign: 'left' },
  taskTitle: { fontSize: 15, fontWeight: 600, color: THEME.textDark },
  taskMeta: { fontSize: 12, color: THEME.textMuted, marginTop: 2 },
  tagChipWrap: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  diaryTagChip: (accent, onTint) => ({ fontSize: 12, fontWeight: 600, color: accent, background: onTint ? THEME.surface : THEME.primarySoft, padding: '3px 8px', borderRadius: 999 }),
};

// 分類標籤 chip（有填細節的顯示「標籤：細節」）。onTint=true 用在淺藍底的全天卡片上，
// chip 背景換成白色避免跟卡片同色被吃掉。
export function DiaryTags({ record, categories, fallback, onTint = false }) {
  const tags = record.diary_tags || [];
  if (tags.length === 0) return fallback ?? null;
  return (
    <div style={S.tagChipWrap}>
      {tags.map((t) => (
        <span key={t} style={S.diaryTagChip(categoryAccentForTag(t, categories || []), onTint)}>
          {t}{record.tag_details?.[t] ? `：${record.tag_details[t]}` : ''}
        </span>
      ))}
    </div>
  );
}

// 地點一個一個 span、同伴全部合併在一個 span（設計稿的底部資訊列）；圖示用線條 icon（emoji 在各平台長得不一樣）
function MetaRow({ locations, people }) {
  const locs = locations || [];
  const ppl = people || [];
  if (locs.length === 0 && ppl.length === 0) return null;
  return (
    <div style={S.meta}>
      {locs.map((loc) => (
        <span key={loc} style={S.metaItem}><Icon name="map-pin" size={13} />{loc}</span>
      ))}
      {ppl.length > 0 && (
        <span style={S.metaItem}><Icon name="user" size={13} />{ppl.join(', ')}</span>
      )}
    </div>
  );
}

// onRecordClick/onTaskClick/onTaskComplete 選填：有傳才可點。紀錄卡點了進編輯；任務卡點標題進編輯、
// 點左邊圓圈在原地展開「標記完成」。三個檢視（月/週/日）傳一樣的 handler，點同一種卡片行為都一樣。
export default function TimelineItems({ timeline, categories, onRecordClick, onTaskClick, onTaskComplete }) {
  const [completingId, setCompletingId] = useState(null);

  return (
    <div style={S.list}>
      {timeline.map((item) => {
        if (item.kind === 'task') {
          const t = item.data;
          const isCompleting = completingId === t.id;
          const Main = onTaskClick ? 'button' : 'div';
          return (
            <div key={`task-${t.id}`} style={S.taskCard}>
              <div style={S.taskRow}>
                {onTaskComplete ? (
                  <button type="button" className="btn-reset tap" style={S.taskCheck(isCompleting)}
                    aria-label={`標記「${t.title}」完成`} aria-expanded={isCompleting}
                    onClick={() => setCompletingId(isCompleting ? null : t.id)} />
                ) : (
                  <span style={S.taskCheck(false)} aria-hidden="true" />
                )}
                <Main {...(onTaskClick ? { type: 'button', className: 'btn-reset', onClick: () => onTaskClick(t) } : {})} style={S.taskMain}>
                  <div style={S.taskTitle}>{t.title}</div>
                  <div style={S.taskMeta}>任務 · 每 {t.interval_value}{INTERVAL_UNIT_LABEL[t.interval_unit]}一次</div>
                </Main>
              </div>
              {isCompleting && (
                <TaskCompleteRow
                  onConfirm={async (date) => { await onTaskComplete(t, date); setCompletingId(null); }}
                  onCancel={() => setCompletingId(null)}
                />
              )}
            </div>
          );
        }
        // record（事件+日記合併後的單一項目）
        const r = item.data;
        const Card = onRecordClick ? 'button' : 'div';
        const cardProps = onRecordClick ? { type: 'button', className: 'btn-reset', onClick: () => onRecordClick(r) } : {};
        const evTags = r.tags || [];
        const diaryTags = r.diary_tags || [];
        const hashtags = r.hashtags || [];
        const hasMeta = (r.locations || []).length > 0 || (r.people || []).length > 0;
        const hasHeader = !!r.title;
        const hasBody = r.title || r.description || r.note || hashtags.length > 0 || evTags.length > 0;
        const hasFooter = diaryTags.length > 0 || hasMeta;
        const isEmpty = !hasBody && !hasFooter;

        return (
          <Card key={`rec-${r.id}`} {...cardProps} style={{ ...(r.all_day ? S.allDayCard : S.card), width: '100%', textAlign: 'left' }}>
            {!r.all_day && <div style={S.cardTime}>{formatRecordTime(r)}</div>}

            {(hasHeader || r.description || r.note) && (
              <div>
                {hasHeader && (
                  <div style={S.titleRow}>
                    <span style={S.entryTitle}>{r.title}</span>
                  </div>
                )}
                {r.description && <div style={{ ...S.note, marginTop: hasHeader ? 4 : 0 }}>{r.description}</div>}
                {r.note && <div style={{ ...S.note, marginTop: (hasHeader || r.description) ? 4 : 0 }}>{r.note}</div>}
              </div>
            )}

            {hashtags.length > 0 && (
              <div style={S.hashtagsRow}>
                {/* 全天卡底色跟 hashtagBg 同色，chip 換白底才不會被吃掉 */}
                {hashtags.map((h) => (
                  <span key={h} style={{ ...S.hashtagChip, background: r.all_day ? THEME.surface : THEME.hashtagBg }}>#{h}</span>
                ))}
              </div>
            )}

            {evTags.length > 0 && (
              <div style={S.tagsRow}>
                {evTags.map((t) => (
                  <span key={t} style={{ ...S.tagChip, background: r.all_day ? THEME.surface : THEME.bg }}>{t}</span>
                ))}
              </div>
            )}

            {hasFooter && (
              <>
                {hasBody && <div style={S.divider} />}
                <div style={S.footerRow}>
                  {diaryTags.length > 0 && <DiaryTags record={r} categories={categories} onTint={!!r.all_day} />}
                  <MetaRow locations={r.locations} people={r.people} />
                </div>
              </>
            )}

            {isEmpty && <span style={{ ...S.empty, display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="pencil" size={13} />這則紀錄還沒有內容</span>}
          </Card>
        );
      })}
    </div>
  );
}
