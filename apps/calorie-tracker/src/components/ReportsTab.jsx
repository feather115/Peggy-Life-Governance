// "Reports" tab: weekly bar chart, monthly calendar heatmap, nutrient ratios, monthly statistics, and streak targets
import React, { useState } from 'react';
import { buildWeek, buildMonth, computeStreak } from '../selectors.js';
import { DOW } from '../constants.js';
import FoodHistoryCard from './FoodHistoryCard.jsx';
import Icon from '@peggy-life/shared/Icon.jsx';
import { UI } from '@peggy-life/shared/ui';

const S = {
  page: { paddingBottom: 24 },
  card: { ...UI.card, margin: '12px 20px 0', padding: 16 },
  cardTitle: { ...UI.sectionTitle, marginBottom: 14 },
  chart: { position: 'relative', height: 150, display: 'flex', gap: 2, padding: '0 2px' },
  goalLine: (b) => ({ position: 'absolute', left: 0, right: 0, bottom: b, borderTop: '1px dashed var(--goal-line)', zIndex: 1 }),
  goalTag: (b) => ({ position: 'absolute', right: 4, bottom: b, transform: 'translateY(-100%)', fontSize: 12, fontWeight: 500, color: 'var(--primary-ink)', background: 'var(--surface)', padding: '2px 6px', borderRadius: 4, zIndex: 2 }),
  barCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  barVal: (color) => ({ fontSize: 12, fontWeight: 500, color, marginBottom: 3, minHeight: 12, ...UI.num }),
  bar: (h, color) => ({ width: '100%', maxWidth: 28, height: h, background: color, borderRadius: 4, position: 'relative' }),
  fastDot: { position: 'absolute', top: -7, left: '50%', transform: 'translateX(-50%)', width: 5, height: 5, borderRadius: 3, background: 'var(--info)' },
  labels: { display: 'flex', gap: 2, marginTop: 6 },
  tiles: (cols) => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 8, marginTop: 14 }),
  tile: { background: 'var(--sunken)', borderRadius: 10, padding: 12, textAlign: 'center' },
  tileVal: (color) => ({ fontSize: 24, fontWeight: 600, color, ...UI.num }),
  tileLabel: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  monthHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 3 },
  dow: { textAlign: 'center', fontSize: 12, fontWeight: 500, color: 'var(--text-faint)', marginBottom: 6 },
  cell: { aspectRatio: '1', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 0 },
  cellDay: (color) => ({ fontSize: 12, fontWeight: 500, color, ...UI.num }),
  dots: { display: 'flex', gap: 2, marginTop: 1, minHeight: 5 },
  dot: (bg) => ({ width: 4, height: 4, borderRadius: 2, background: bg }),
  legend: { display: 'flex', gap: 12, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' },
  swatch: (bg, round) => ({ width: round ? 6 : 10, height: round ? 6 : 10, borderRadius: round ? 3 : 3, background: bg }),
  ratioBar: { display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden' },
  ratioLegend: { display: 'flex', justifyContent: 'space-between', marginTop: 10 },
  streak: { marginTop: 8, background: 'var(--primary-soft)', borderRadius: 10, padding: 14, textAlign: 'center' },
  streakNum: { fontSize: 32, fontWeight: 600, color: 'var(--primary-ink)', marginTop: 2, ...UI.num },
};

export default function ReportsTab({ app, onSelectDate }) {
  const { days, goalCal, fastingTagDefs, otherTagDefs } = app;
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const fastingIds = fastingTagDefs.map((t) => t.id);
  const otherIds = otherTagDefs.map((t) => t.id);

  const { weekBars, glb, wAvg, wUnder } = buildWeek(days, goalCal, fastingIds, otherIds);
  const { mLabel, calCells, mAvg, mRecD, mFastD, mOtherD, mpP, mpC, mpF } = buildMonth(days, goalCal, fastingIds, otherTagDefs, monthCursor);
  const streak = computeStreak(days, goalCal);
  const changeMonth = (delta) => {
    setMonthCursor((cur) => new Date(cur.getFullYear(), cur.getMonth() + delta, 1));
  };

  const stats = [
    { val: mRecD, label: '記錄天數', color: 'var(--text)' },
    { val: mAvg, label: '平均 kcal', color: 'var(--text)' },
    { val: mFastD, label: '斷食天數', color: 'var(--info-ink)' },
    { val: mOtherD, label: '特殊標記天數', color: 'var(--warning-ink)' },
  ];

  return (
    <div style={S.page}>
      <header style={UI.header}>
        <div style={{ minWidth: 0 }}>
          <h1 style={UI.title}>飲食報表</h1>
          <p style={UI.subtitle}>每日目標 {goalCal} kcal</p>
        </div>
      </header>

      {/* 本週長條圖 */}
      <section style={{ ...S.card, marginTop: 8 }}>
        <h2 style={S.cardTitle}>本週概覽</h2>
        <div style={S.chart}>
          <div style={S.goalLine(glb)} />
          <div style={S.goalTag(glb)}>目標</div>
          {weekBars.map((bar, i) => (
            <div key={i} style={S.barCol}>
              <div style={S.barVal(bar.calColor)}>{bar.cal}</div>
              <div style={S.bar(bar.height, bar.color)}>
                {bar.hasFast && <div style={S.fastDot} />}
              </div>
            </div>
          ))}
        </div>
        <div style={S.labels}>
          {weekBars.map((bar, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: bar.labelWeight, color: bar.labelColor }}>{bar.label}</div>
          ))}
        </div>
        <div style={S.tiles(2)}>
          <div style={S.tile}>
            <div style={S.tileVal('var(--text)')}>{wAvg}</div>
            <div style={S.tileLabel}>平均 kcal</div>
          </div>
          <div style={S.tile}>
            <div style={S.tileVal('var(--primary-ink)')}>{wUnder}/7</div>
            <div style={S.tileLabel}>達標天數</div>
          </div>
        </div>
      </section>

      {/* 月份月曆 */}
      <section style={S.card}>
        <div style={S.monthHead}>
          <h2 style={UI.sectionTitle}>{mLabel}</h2>
          <div style={UI.headerActions}>
            <button type="button" onClick={() => changeMonth(-1)} aria-label="上一個月" style={UI.iconBtn}><Icon name="chevron-left" size={20} /></button>
            <button type="button" onClick={() => changeMonth(1)} aria-label="下一個月" style={UI.iconBtn}><Icon name="chevron-right" size={20} /></button>
          </div>
        </div>
        <div style={S.grid}>
          {DOW.map((d) => <div key={d} style={S.dow}>{d}</div>)}
        </div>
        <div style={S.grid}>
          {calCells.map((cell, i) => (
            <button
              key={cell.dateKey || `empty-${i}`}
              type="button"
              disabled={cell.empty || cell.isFuture}
              onClick={() => onSelectDate?.(cell.dateKey)}
              aria-label={cell.empty ? undefined : `查看 ${cell.dateKey} 的紀錄`}
              style={{ ...S.cell, background: cell.empty ? 'transparent' : cell.bg, border: cell.empty ? '2px solid transparent' : cell.todayBorder, cursor: cell.empty || cell.isFuture ? 'default' : 'pointer' }}
            >
              {!cell.empty && <>
                <div style={S.cellDay(cell.textColor)}>{cell.day}</div>
                <div style={S.dots}>
                  {cell.hasFast && <div style={S.dot('var(--info)')} />}
                  {(cell.otherColors || []).slice(0, 4).map((color, idx) => (
                    <div key={`${color}-${idx}`} style={S.dot(color)} />
                  ))}
                </div>
              </>}
            </button>
          ))}
        </div>
        <div style={S.legend}>
          {[{ bg: 'var(--heat-ok)', label: '達標' }, { bg: 'var(--heat-near)', label: '接近' }, { bg: 'var(--heat-over)', label: '超標' }].map((l) => (
            <div key={l.label} style={S.legendItem}><div style={S.swatch(l.bg)} />{l.label}</div>
          ))}
          <div style={S.legendItem}><div style={S.swatch('var(--info)', true)} />斷食</div>
          <div style={S.legendItem}><div style={S.swatch('var(--warning)', true)} />記錄原因（標籤色）</div>
        </div>
      </section>

      {/* 營養素比例 */}
      <section style={S.card}>
        <h2 style={S.cardTitle}>營養素比例</h2>
        <div style={S.ratioBar}>
          <div style={{ width: `${mpP}%`, background: 'var(--primary-ink)' }} />
          <div style={{ width: `${mpC}%`, background: 'var(--carb)' }} />
          <div style={{ width: `${mpF}%`, background: 'var(--fat)' }} />
        </div>
        <div style={S.ratioLegend}>
          {[{ color: 'var(--primary-ink)', label: `蛋白質 ${mpP}%` }, { color: 'var(--carb)', label: `碳水 ${mpC}%` }, { color: 'var(--fat)', label: `脂肪 ${mpF}%` }].map((m) => (
            <div key={m.label} style={{ ...S.legendItem, color: 'var(--text)' }}><div style={S.swatch(m.color, true)} />{m.label}</div>
          ))}
        </div>
      </section>

      {/* 月份統計 */}
      <section style={S.card}>
        <h2 style={{ ...S.cardTitle, marginBottom: 0 }}>{mLabel}統計</h2>
        <div style={S.tiles(2)}>
          {stats.map((s) => (
            <div key={s.label} style={S.tile}>
              <div style={S.tileVal(s.color)}>{s.val}</div>
              <div style={S.tileLabel}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={S.streak}>
          <div style={S.tileLabel}>目前連續達標</div>
          <div style={S.streakNum}>{streak} <span style={{ fontSize: 14, fontWeight: 500 }}>天</span></div>
        </div>
      </section>

      {/* 飲食歷史：搜尋某食物哪幾天吃過、或看每個餐別通常吃什麼 */}
      <FoodHistoryCard app={app} />
    </div>
  );
}
