// "Reports" tab: weekly bar chart, monthly calendar heatmap, nutrient ratios, monthly statistics, and streak targets
import React, { useState } from 'react';
import { buildWeek, buildMonth, computeStreak } from '../selectors.js';
import FoodHistoryCard from './FoodHistoryCard.jsx';

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
    { val: mRecD, label: '記錄天數', color: '#234034' },
    { val: mAvg, label: '平均 kcal', color: '#234034' },
    { val: mFastD, label: '斷食天數', color: '#4361EE' },
    { val: mOtherD, label: '特殊標記天數', color: '#E8A13C' },
  ];

  return (
    <div style={{ padding: '6px 18px 20px' }}>
      <div style={{ fontSize: 24, fontWeight: 900, color: '#234034', marginBottom: 4 }}>飲食報表</div>
      <div style={{ fontSize: 14, color: '#6E8B7C', fontWeight: 700 }}>追蹤你的進度，持續改善</div>

      {/* 本週長條圖 */}
      <div style={{ background: '#fff', borderRadius: 24, padding: '20px 14px 16px', marginTop: 14, boxShadow: '0 10px 24px -18px rgba(46,139,94,.5)' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#234034', marginBottom: 14, padding: '0 4px' }}>本週概覽</div>
        <div style={{ position: 'relative', height: 150, display: 'flex', gap: 2, padding: '0 2px' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: glb, borderTop: '2px dashed rgba(46,139,94,.3)', zIndex: 1 }} />
          <div style={{ position: 'absolute', right: 6, bottom: glb, transform: 'translateY(-100%)', fontSize: 10, fontWeight: 800, color: '#2E8B5E', background: '#EAF5EE', padding: '2px 6px', borderRadius: 6, zIndex: 2 }}>目標</div>
          {weekBars.map((bar, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: bar.calColor, marginBottom: 3, minHeight: 12 }}>{bar.cal}</div>
              <div style={{ width: '100%', maxWidth: 30, height: bar.height, background: bar.color, borderRadius: 6, position: 'relative' }}>
                {bar.hasFast && <div style={{ position: 'absolute', top: -5, left: '50%', transform: 'translateX(-50%)', width: 5, height: 5, borderRadius: '50%', background: '#4361EE' }} />}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 2, marginTop: 6 }}>
          {weekBars.map((bar, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: bar.labelWeight, color: bar.labelColor }}>{bar.label}</div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <div style={{ flex: 1, background: '#F6FAF7', borderRadius: 14, padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#234034' }}>{wAvg}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6E8B7C', marginTop: 2 }}>平均 kcal</div>
          </div>
          <div style={{ flex: 1, background: '#F6FAF7', borderRadius: 14, padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#2E8B5E' }}>{wUnder}/7</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6E8B7C', marginTop: 2 }}>達標天數</div>
          </div>
        </div>
      </div>

      {/* 月份月曆 */}
      <div style={{ background: '#fff', borderRadius: 24, padding: '20px 14px 16px', marginTop: 12, boxShadow: '0 10px 24px -18px rgba(46,139,94,.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12, padding: '0 4px' }}>
          <button onClick={() => changeMonth(-1)} aria-label="上一個月" style={{ border: 'none', background: '#F6FAF7', color: '#234034', width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', fontSize: 20, fontWeight: 900, lineHeight: 1 }}>‹</button>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#234034', textAlign: 'center' }}>{mLabel}</div>
          <button onClick={() => changeMonth(1)} aria-label="下一個月" style={{ border: 'none', background: '#F6FAF7', color: '#234034', width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', fontSize: 20, fontWeight: 900, lineHeight: 1 }}>›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 6 }}>
          {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: '#9bb0a3' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
          {calCells.map((cell, i) => (
            <button
              key={cell.dateKey || `empty-${i}`}
              type="button"
              disabled={cell.empty || cell.isFuture}
              onClick={() => onSelectDate?.(cell.dateKey)}
              aria-label={cell.empty ? undefined : `查看 ${cell.dateKey} 的紀錄`}
              style={{ aspectRatio: '1', background: cell.empty ? 'transparent' : cell.bg, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: cell.empty ? '2px solid transparent' : cell.todayBorder, padding: 0, cursor: cell.empty || cell.isFuture ? 'default' : 'pointer', opacity: cell.empty ? 1 : cell.isFuture ? 0.75 : 1 }}
            >
              {!cell.empty && <>
                <div style={{ fontSize: 12, fontWeight: 800, color: cell.textColor }}>{cell.day}</div>
                <div style={{ display: 'flex', gap: 2, marginTop: 1, minHeight: 5 }}>
                  {cell.hasFast && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#4361EE' }} />}
                  {(cell.otherColors || []).slice(0, 4).map((color, idx) => (
                    <div key={`${color}-${idx}`} style={{ width: 4, height: 4, borderRadius: '50%', background: color }} />
                  ))}
                </div>
              </>}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[{ bg: '#DCEDE3', label: '達標' }, { bg: '#FEEFC3', label: '接近' }, { bg: '#FECACA', label: '超標' }].map((l) => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}><div style={{ width: 8, height: 8, borderRadius: 3, background: l.bg }} /><span style={{ fontSize: 11, fontWeight: 700, color: '#6E8B7C' }}>{l.label}</span></div>
          ))}
          {[{ bg: '#4361EE', label: '斷食' }, { bg: 'linear-gradient(90deg,#E8A13C,#EC4899,#5FA8D3)', label: '記錄原因' }].map((l) => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}><div style={{ width: 5, height: 5, borderRadius: '50%', background: l.bg }} /><span style={{ fontSize: 11, fontWeight: 700, color: '#6E8B7C' }}>{l.label}</span></div>
          ))}
        </div>
      </div>

      {/* 營養素比例 */}
      <div style={{ background: '#fff', borderRadius: 24, padding: '20px 16px', marginTop: 12, boxShadow: '0 10px 24px -18px rgba(46,139,94,.5)' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#234034', marginBottom: 12 }}>營養素比例</div>
        <div style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden' }}>
          <div style={{ width: `${mpP}%`, background: '#2E8B5E' }} />
          <div style={{ width: `${mpC}%`, background: '#E8A13C' }} />
          <div style={{ width: `${mpF}%`, background: '#5FA8D3' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
          {[{ color: '#2E8B5E', label: `蛋白質 ${mpP}%` }, { color: '#E8A13C', label: `碳水 ${mpC}%` }, { color: '#5FA8D3', label: `脂肪 ${mpF}%` }].map((m) => (
            <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color }} /><span style={{ fontSize: 12, fontWeight: 800, color: '#234034' }}>{m.label}</span></div>
          ))}
        </div>
      </div>

      {/* 月份統計 */}
      <div style={{ background: '#fff', borderRadius: 24, padding: '20px 14px', marginTop: 12, boxShadow: '0 10px 24px -18px rgba(46,139,94,.5)' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#234034', marginBottom: 12, padding: '0 4px' }}>{mLabel}統計</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ background: '#F6FAF7', borderRadius: 16, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6E8B7C', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, background: '#E3F2E9', borderRadius: 16, padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6E8B7C' }}>目前連續達標</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#2E8B5E', marginTop: 2 }}>{streak} <span style={{ fontSize: 14, fontWeight: 800 }}>天</span></div>
        </div>
      </div>

      {/* 飲食歷史：搜尋某食物哪幾天吃過、或看每個餐別通常吃什麼 */}
      <FoodHistoryCard app={app} />
    </div>
  );
}
