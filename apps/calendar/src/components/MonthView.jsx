// 月檢視：格線月曆（有紀錄的日期顯示顏色小圓點）+ 下方選中日期的摘要卡。
// 換月的 ‹ › 在 App.jsx 的頁首右側（三個檢視同一個位置）。
// 點日期只會「選中」該天並更新摘要卡，不會離開月檢視；點摘要卡標題跳去日檢視（onOpenDay），
// 摘要卡裡的項目跟日檢視一樣可以直接點（紀錄→編輯、任務圓圈→標記完成），摘要卡最後一列可直接在選中那天新增紀錄。
import React, { useMemo } from 'react';
import Icon from '@peggy-life/shared/Icon.jsx';
import { UI } from '@peggy-life/shared/ui';
import { DOW, buildDayTimeline, getMonthDays, parseDateKey, todayKey } from '../utils.js';
import { THEME } from '../theme.js';
import TimelineItems from './TimelineItems.jsx';

const taskDotStyle = { width: 6, height: 6, borderRadius: 1, background: THEME.textFaint };

const S = {
  panel: { ...UI.card, margin: '8px 20px 0', padding: '12px 8px' },
  dowRow: { display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', paddingBottom: 6, textAlign: 'center' },
  dow: { fontSize: 12, fontWeight: 500, color: THEME.textFaint },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', rowGap: 2 },
  dayCell: { height: 50, padding: 0, border: 'none', background: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 },
  badge: (isToday, isSelected) => ({
    width: 32, height: 32, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, ...UI.num,
    fontWeight: isToday || isSelected ? 600 : 400,
    background: isToday ? THEME.primary : isSelected ? THEME.primarySoft : 'transparent',
    color: isToday ? 'var(--on-primary)' : isSelected ? THEME.primaryInk : THEME.textDark,
  }),
  dotsRow: { display: 'flex', gap: 3, alignItems: 'center', height: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  legend: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 8 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: THEME.textMuted },
  cardHeader: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 16px', border: 'none', borderBottom: `1px solid ${THEME.border}`, background: 'none', textAlign: 'left' },
  cardHeaderLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  cardHeaderLink: { display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 14, fontWeight: 500, color: THEME.primaryInk },
};

export default function MonthView({ anchorKey, selectedDateKey, onSelectDay, onOpenDay, onCreate, recordsByDate, categories, tasksByDueDate, onEditRecord, onEditTask, onCompleteTask }) {
  const anchor = parseDateKey(anchorKey);
  const monthDays = useMemo(() => getMonthDays(anchor.getFullYear(), anchor.getMonth()), [anchor]);

  const today = todayKey();
  const selectedDate = parseDateKey(selectedDateKey);
  const selectedTimeline = buildDayTimeline(recordsByDate[selectedDateKey], tasksByDueDate?.[selectedDateKey]);
  const isSelectedToday = selectedDateKey === today;
  const md = `${selectedDate.getMonth() + 1}/${selectedDate.getDate()}`;

  return (
    <>
      <section aria-label="月曆" style={S.panel}>
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
                key={dateKey}
                style={S.dayCell}
                onClick={() => onSelectDay(dateKey)}
                aria-pressed={isSelected}
                aria-label={`${date.getMonth() + 1}月${date.getDate()}日${isToday ? '（今天）' : ''}${dayRecords.length ? `，${dayRecords.length} 筆紀錄` : ''}${hasTaskDue ? '，有任務到期' : ''}`}
              >
                <span style={S.badge(isToday, isSelected)}>{date.getDate()}</span>
                <span style={S.dotsRow}>
                  {dotColors.slice(0, 3).map((c) => (
                    <span key={c} style={{ ...S.dot, background: c }} />
                  ))}
                  {hasTaskDue && <span style={taskDotStyle} />}
                </span>
              </button>
            );
          })}
        </div>

        <div style={S.legend}>
          <span style={S.legendItem}><span style={{ ...S.dot, background: THEME.primaryInk }} />紀錄</span>
          <span style={S.legendItem}><span style={taskDotStyle} />任務到期</span>
        </div>
      </section>

      <section style={{ ...UI.section, marginBottom: 24 }}>
        <div style={UI.listCard}>
          <button type="button" style={S.cardHeader} onClick={() => onOpenDay(selectedDateKey)}>
            <span style={S.cardHeaderLeft}>
              <span style={UI.sectionTitle}>{selectedDate.getMonth() + 1}月{selectedDate.getDate()}日 週{DOW[selectedDate.getDay()]}</span>
              {isSelectedToday && <span style={UI.tag('primary')}>今天</span>}
            </span>
            <span style={S.cardHeaderLink}>完整檢視<Icon name="chevron-right" size={16} /></span>
          </button>
          {selectedTimeline.length === 0 ? (
            <div style={UI.empty}>這天還沒有記錄</div>
          ) : (
            <TimelineItems
              timeline={selectedTimeline}
              categories={categories}
              onRecordClick={onEditRecord}
              onTaskClick={onEditTask}
              onTaskComplete={onCompleteTask}
            />
          )}
          <button type="button" style={UI.addRow} onClick={() => onCreate(selectedDateKey)}>
            <Icon name="plus" size={18} />新增 {md} 的紀錄
          </button>
        </div>
      </section>
    </>
  );
}
