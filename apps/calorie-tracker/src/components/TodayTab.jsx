// "Today" tab: 頁首（日期＋前後一天）、熱量摘要卡（已攝取／環／三大營養素）、五個餐別清單、AI 摘要、進階設定入口
// 餐點列整列可點 → 編輯面板（刪除也在裡面，刪完 5 秒內可復原）；每個餐別清單最後一列是「＋ 加入早餐」
import React, { useState } from 'react';
import { MEALS_DEF, DOW } from '../constants.js';
import { todayKey, dkFrom, parseDk, greeting, pct, emptyDay, alertError, readableOn } from '../utils.js';
import { dayTotals, ringInfo } from '../selectors.js';
import EditMealItemSheet from './EditMealItemSheet.jsx';
import Icon from '@peggy-life/shared/Icon.jsx';
import { UI } from '@peggy-life/shared/ui';
import { toast } from '@peggy-life/shared/feedback.jsx';

const S = {
  page: { paddingBottom: 24 },
  backToday: { minHeight: 28, padding: '0 10px', border: 'none', borderRadius: 999, background: 'var(--primary-soft)', color: 'var(--primary-ink)', fontSize: 12, fontWeight: 500 },
  summary: { ...UI.card, margin: '8px 20px 0', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 },
  summaryTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  summaryText: { display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 },
  label: { fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' },
  numRow: { display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 },
  bigNum: { fontSize: 40, lineHeight: 1, fontWeight: 600, letterSpacing: -0.5, color: 'var(--text)', ...UI.num },
  goal: { fontSize: 15, color: 'var(--text-muted)', ...UI.num },
  remain: (color) => ({ fontSize: 14, fontWeight: 500, color }),
  tagChips: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  tagChip: (bg, color) => ({ border: 'none', background: bg, color, borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 500 }),
  ring: { position: 'relative', width: 88, height: 88, flex: 'none' },
  ringPct: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600, color: 'var(--text)', ...UI.num },
  hr: { height: 1, background: 'var(--line)' },
  macros: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 },
  macro: { display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 },
  macroLabel: { fontSize: 13, color: 'var(--text-muted)' },
  macroVal: { fontSize: 15, fontWeight: 500, color: 'var(--text)', ...UI.num },
  macroGoal: { fontWeight: 400, color: 'var(--text-faint)' },
  bar: { height: 4, borderRadius: 2, background: 'var(--track)', overflow: 'hidden' },
  barFill: (w, color) => ({ width: `${w}%`, height: '100%', borderRadius: 2, background: color }),
  mealHead: { ...UI.sectionHead, justifyContent: 'flex-start' },
  itemRow: { ...UI.row, justifyContent: 'space-between' },
  brand: { fontWeight: 400, color: 'var(--text-muted)' },
  noteCard: { ...UI.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 },
  noteHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  noteText: { margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--text-muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  advRow: { ...UI.row, ...UI.card },
};

const round = (v) => Math.round(Number(v) || 0);
const monthDay = (dk) => { const d = parseDk(dk); return `${d.getMonth() + 1}月${d.getDate()}日`; };
const weekday = (dk) => `週${DOW[parseDk(dk).getDay()]}`;

export default function TodayTab({ app, selectedDate, setSelectedDate, onOpenSheet, onOpenAdvanced }) {
  const { days, goalCal, goalP, goalC, goalF, fastingTagDefs, otherTagDefs, addMeal, removeMeal, editMeal, displayName } = app;
  const [editing, setEditing] = useState(null); // { mealKey, mealLabel, item } | null

  const isTod = selectedDate === todayKey();
  const curDay = days[selectedDate] || emptyDay();
  const activeTags = curDay.tags?.activeTags || [];
  const allTagDefs = [...fastingTagDefs, ...otherTagDefs];
  const fastingIds = fastingTagDefs.map((t) => t.id);

  const cur = dayTotals(curDay);
  const consumed = Math.round(cur.cal);
  const { ringColor, remainColor, remainText } = ringInfo(consumed, goalCal);

  const meals = MEALS_DEF.map((m) => {
    const items = curDay.meals[m.key] || [];
    const subtotal = items.reduce((s, i) => s + Number(i.cal || 0), 0);
    return { ...m, items, subtotal, isEmpty: items.length === 0 };
  });

  const activeTagChips = activeTags.map((tid) => {
    const def = allTagDefs.find((t) => t.id === tid);
    if (!def) return null;
    const isFasting = fastingIds.includes(tid);
    const tagColor = def.color || '#E8A13C';
    return { label: def.label, bg: isFasting ? 'var(--info-bg)' : tagColor, color: isFasting ? 'var(--info-ink)' : readableOn(tagColor) };
  }).filter(Boolean);

  const macros = [
    { label: '蛋白質', t: Math.round(cur.p), g: goalP, color: 'var(--primary-ink)' },
    { label: '碳水', t: Math.round(cur.c), g: goalC, color: 'var(--carb)' },
    { label: '脂肪', t: Math.round(cur.f), g: goalF, color: 'var(--fat)' },
  ];

  // 刪除不先問，直接刪、給 5 秒「復原」（比每次都跳確認框順；復原＝把同一筆重新加回去，會排到該餐最後）
  const deleteItem = async (mealKey, it) => {
    const date = selectedDate;
    try {
      await removeMeal(date, mealKey, it.id);
    } catch (e) {
      alertError('刪除', e);
      return;
    }
    toast(`已刪除「${it.name}」`, {
      action: {
        label: '復原',
        onClick: () => addMeal(date, mealKey, { name: it.name, brand: it.brand, unit: it.unit, cal: it.cal, p: it.p, c: it.c, f: it.f })
          .catch((e) => alertError('復原', e)),
      },
    });
  };

  const prevDay = () => { const d = parseDk(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(dkFrom(d)); };
  const nextDay = () => { const d = parseDk(selectedDate); d.setDate(d.getDate() + 1); if (d > new Date()) return; setSelectedDate(dkFrom(d)); };

  return (
    <div style={S.page}>
      <header style={UI.header}>
        <div style={{ minWidth: 0 }}>
          <h1 style={UI.title}>{isTod ? '今天' : monthDay(selectedDate)}</h1>
          {isTod ? (
            <p style={UI.subtitle}>{monthDay(selectedDate)} {weekday(selectedDate)} · {greeting()}{displayName ? `，${displayName}` : ''}</p>
          ) : (
            <p style={UI.subtitle}>
              {weekday(selectedDate)}
              <button type="button" className="tap" onClick={() => setSelectedDate(todayKey())} style={S.backToday}>回到今天</button>
            </p>
          )}
        </div>
        <div style={UI.headerActions}>
          <button type="button" aria-label="前一天" onClick={prevDay} style={UI.iconBtn}><Icon name="chevron-left" size={20} /></button>
          <button type="button" aria-label="後一天" onClick={nextDay} disabled={isTod} style={{ ...UI.iconBtn, opacity: isTod ? 0.35 : 1 }}><Icon name="chevron-right" size={20} /></button>
        </div>
      </header>

      <section aria-label="今日熱量" style={S.summary}>
        <div style={S.summaryTop}>
          <div style={S.summaryText}>
            <span style={S.label}>已攝取</span>
            <div style={S.numRow}>
              <span style={S.bigNum}>{consumed}</span>
              <span style={S.goal}>/ {goalCal} kcal</span>
            </div>
            <span style={S.remain(remainColor)}>{remainText}</span>
            {activeTagChips.length > 0 && (
              <div style={S.tagChips}>
                {activeTagChips.map((chip, i) => (
                  <button key={i} type="button" className="tap" onClick={onOpenAdvanced} style={S.tagChip(chip.bg, chip.color)}>{chip.label}</button>
                ))}
              </div>
            )}
          </div>
          <div style={S.ring}>
            <svg width="88" height="88" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--track)" strokeWidth="9" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={ringColor} strokeWidth="9" strokeLinecap="round" pathLength="100" strokeDasharray={`${pct(consumed, goalCal)} 100`} transform="rotate(-90 50 50)" />
            </svg>
            <span style={S.ringPct}>{Math.round((consumed / (goalCal || 1)) * 100)}%</span>
          </div>
        </div>
        <div style={S.hr} />
        <div style={S.macros}>
          {macros.map((m) => (
            <div key={m.label} style={S.macro}>
              <span style={S.macroLabel}>{m.label}</span>
              <span style={S.macroVal}>{m.t} <span style={S.macroGoal}>/ {m.g} g</span></span>
              <div style={S.bar}><div style={S.barFill(pct(m.t, m.g), m.color)} /></div>
            </div>
          ))}
        </div>
      </section>

      {meals.map((meal) => (
        <section key={meal.key} aria-labelledby={`meal-${meal.key}`} style={UI.section}>
          <div style={S.mealHead}>
            <h2 id={`meal-${meal.key}`} style={UI.sectionTitle}>{meal.label}</h2>
            {!meal.isEmpty && <span style={{ ...UI.rowMeta, ...UI.num }}>{Math.round(meal.subtotal)} kcal</span>}
          </div>
          <div style={UI.listCard}>
            {meal.items.map((it, i) => (
              <React.Fragment key={it.id}>
                {i > 0 && <div style={UI.divider} />}
                <button type="button" style={S.itemRow} onClick={() => setEditing({ mealKey: meal.key, mealLabel: meal.label, item: it })}>
                  <span style={UI.rowText}>
                    <span style={UI.rowTitle}>{it.name}{it.brand && <span style={S.brand}> · {it.brand}</span>}</span>
                    <span style={UI.rowMeta}>{it.unit} · 蛋 {round(it.p)} · 碳 {round(it.c)} · 脂 {round(it.f)}</span>
                  </span>
                  <span style={UI.rowValue}>{round(it.cal)}</span>
                </button>
              </React.Fragment>
            ))}
            <button type="button" onClick={() => onOpenSheet(meal.key)} style={meal.isEmpty ? { ...UI.addRow, borderTop: 'none' } : UI.addRow}>
              <Icon name="plus" size={18} />加入{meal.label}
            </button>
          </div>
        </section>
      ))}

      {/* 當日 AI 摘要（有內容才顯示）*/}
      {curDay.dayNote && (
        <section style={UI.section}>
          <div style={S.noteCard}>
            <div style={S.noteHead}>
              <h2 style={UI.sectionTitle}>今日摘要</h2>
              <button type="button" className="tap" onClick={onOpenAdvanced} style={{ ...UI.btnText, minHeight: 32, padding: '0 4px' }}>編輯</button>
            </div>
            <p style={S.noteText}>{curDay.dayNote}</p>
          </div>
        </section>
      )}

      {/* 進階設定入口 */}
      <section style={UI.section}>
        <button type="button" onClick={onOpenAdvanced} style={S.advRow}>
          <Icon name="sliders" size={20} style={{ color: 'var(--text-muted)' }} />
          <span style={UI.rowText}>
            <span style={UI.rowTitle}>進階設定</span>
            <span style={UI.rowMeta}>今日標籤、AI 摘要</span>
          </span>
          {activeTags.length > 0 && <span style={UI.tag('neutral')}>{activeTags.length} 個標籤</span>}
          <Icon name="chevron-right" size={18} style={{ color: 'var(--text-faint)' }} />
        </button>
      </section>

      {editing && (
        <EditMealItemSheet
          item={editing.item}
          mealLabel={editing.mealLabel}
          onClose={() => setEditing(null)}
          onSave={(patch) => editMeal(selectedDate, editing.mealKey, editing.item.id, patch)}
          onDelete={() => deleteItem(editing.mealKey, editing.item)}
        />
      )}
    </div>
  );
}
