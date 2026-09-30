// 月檢視：格線月曆（有紀錄的日期顯示顏色小圓點）+ 下方選中日期的摘要卡。
// 點日期只會「選中」該天並更新摘要卡，不會離開月檢視；點摘要卡標題跳去日檢視（onOpenDay），
// 摘要卡裡的項目跟日檢視一樣可以直接點（紀錄→編輯、任務圓圈→標記完成），摘要卡底部可直接在選中那天新增紀錄。
import React, { useMemo } from 'react';
import Icon from '@peggy-life/shared/Icon.jsx';
import { DOW, buildDayTimeline, getMonthDays, monthLabel, parseDateKey, todayKey } from '../utils.js';
import { THEME } from '../theme.js';
import TimelineItems from './TimelineItems.jsx';

const taskDotStyle = { width: 6, height: 6, borderRadius: 1, background: THEME.textMuted };

const S = {
  panel: { background: THEME.surface, borderRadius: THEME.radius, padding: 14, margin: '6px 20px 0', boxShadow: THEME.shadow },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { border: 'none', background: 'none', color: THEME.textMuted, width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: 700, color: THEME.textDark },
  legend: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 4px 8px' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 5 },
  legendDot: { width: 6, height: 6, borderRadius: '50%' },
  legendLabel: { fontSize: 12, color: THEME.textMuted },
  dowRow: { display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', padding: '8px 2px 2px', textAlign: 'center' },
  dow: { fontSize: 12, color: THEME.textFaint, fontWeight: 600, paddingBottom: 6 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, paddingBottom: 4 },
  dayCell: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 46, borderRadius: THEME.radiusSm, padding: '4px 0' },
  badge: { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 },
  dotsRow: { display: 'flex', gap: 3, alignItems: 'center', height: 6 },
  dot: { width: 6, height: 6, borderRadius: '50%' },
};

const DetailCardStyle = {
  card: { margin: '16px 20px 20px', background: THEME.surface, borderRadius: THEME.radius, boxShadow: THEME.shadow, overflow: 'hidden' },
  cardHeader: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${THEME.border}` },
  cardHeaderLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  cardHeaderTitle: { fontSize: 14, fontWeight: 700, color: THEME.textDark },
  todayBadge: { fontSize: 12, fontWeight: 700, color: '#fff', background: THEME.primary, padding: '2px 7px', borderRadius: 999 },
  cardHeaderLink: { fontSize: 13, color: THEME.primaryInk, fontWeight: 600 },
  cardBody: { padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 },
  empty: { fontSize: 13, color: THEME.textFaint, padding: '8px 0' },
  addBtn: { marginTop: 8, width: '100%', border: `1px dashed ${THEME.primaryInk}`, background: THEME.primarySoft, color: THEME.primaryInk, padding: '11px', borderRadius: THEME.radiusSm, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
};

export default function MonthView({ anchorKey, onShift, selectedDateKey, onSelectDay, onOpenDay, onCreate, recordsByDate, categories, tasksByDueDate, onEditRecord, onEditTask, onCompleteTask }) {
  const anchor = parseDateKey(anchorKey);
  const monthDays = useMemo(() => getMonthDays(anchor.getFullYear(), anchor.getMonth()), [anchor]);

  const today = todayKey();
  const selectedDate = parseDateKey(selectedDateKey);
  const selectedTimeline = buildDayTimeline(recordsByDate[selectedDateKey], tasksByDueDate?.[selectedDateKey]);
  const isSelectedToday = selectedDateKey === today;

  return (
    <>
      <div style={S.panel}>
        <div style={S.header}>
          <button type="button" onClick={() => onShift(-1)} style={S.navBtn} aria-label="上一個月"><Icon name="chevron-left" size={22} /></button>
          <div style={S.title}>{monthLabel(anchor.getFullYear(), anchor.getMonth())}</div>
          <button type="button" onClick={() => onShift(1)} style={S.navBtn} aria-label="下一個月"><Icon name="chevron-right" size={22} /></button>
        </div>

        <div style={S.legend}>
          <div style={S.legendItem}>
            <span style={{ ...S.legendDot, background: THEME.primary }} />
            <span style={S.legendLabel}>紀錄</span>
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
            const dayRecords = recordsByDate[dateKey] || [];
            const hasTaskDue = ((tasksByDueDate && tasksByDueDate[dateKey]) || []).length > 0;
            const isToday = dateKey === today;
            const isSelected = dateKey === selectedDateKey;

            const dotColors = [];
            dayRecords.forEach((r) => {
              const c = r.color || THEME.primaryDark;
              if (!dotColors.includes(c)) dotColors.push(c);
            });

            return (
              <button
                type="button"
                className="btn-reset"
                key={dateKey}
                style={{ ...S.dayCell, background: isSelected && !isToday ? THEME.primarySoft : 'transparent' }}
                onClick={() => onSelectDay(dateKey)}
                aria-pressed={isSelected}
                aria-label={`${date.getMonth() + 1}月${date.getDate()}日${isToday ? '（今天）' : ''}${dayRecords.length ? `，${dayRecords.length} 筆紀錄` : ''}${hasTaskDue ? '，有任務到期' : ''}`}
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
                  {hasTaskDue && <span style={taskDotStyle} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={DetailCardStyle.card}>
        <button type="button" className="btn-reset" style={DetailCardStyle.cardHeader} onClick={() => onOpenDay(selectedDateKey)}>
          <div style={DetailCardStyle.cardHeaderLeft}>
            <div style={DetailCardStyle.cardHeaderTitle}>{selectedDate.getMonth() + 1}月{selectedDate.getDate()}日 週{DOW[selectedDate.getDay()]}</div>
            {isSelectedToday && <span style={DetailCardStyle.todayBadge}>今天</span>}
          </div>
          <div style={DetailCardStyle.cardHeaderLink}>完整檢視 ›</div>
        </button>
        <div style={DetailCardStyle.cardBody}>
          {selectedTimeline.length === 0 ? (
            <div style={DetailCardStyle.empty}>這天還沒有記錄</div>
          ) : (
            <TimelineItems
              timeline={selectedTimeline}
              categories={categories}
              onRecordClick={onEditRecord}
              onTaskClick={onEditTask}
              onTaskComplete={onCompleteTask}
            />
          )}
          <button type="button" style={DetailCardStyle.addBtn} onClick={() => onCreate(selectedDateKey)}>
            <Icon name="plus" size={16} />新增 {selectedDate.getMonth() + 1}/{selectedDate.getDate()} 的紀錄
          </button>
        </div>
      </div>
    </>
  );
}
