// "Today" tab: date switcher, calorie ring, macronutrients, five meal cards, AI summary, and advanced entries
import React, { useState } from 'react';
import { MEALS_DEF } from '../constants.js';
import { todayKey, dkFrom, parseDk, dateLabel, greeting, pct, emptyDay, alertError, readableOn } from '../utils.js';
import { dayTotals, ringInfo } from '../selectors.js';
import EditMealItemSheet from './EditMealItemSheet.jsx';
import Icon from '@peggy-life/shared/Icon.jsx';
import { toast } from '@peggy-life/shared/feedback.jsx';

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
  const { ringColor, remainColor, remainBg, remainText } = ringInfo(consumed, goalCal);

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
  const deleteItem = async (meal, it) => {
    const date = selectedDate;
    try {
      await removeMeal(date, meal.key, it.id);
    } catch (e) {
      alertError('刪除', e);
      return;
    }
    toast(`已刪除「${it.name}」`, {
      action: {
        label: '復原',
        onClick: () => addMeal(date, meal.key, { name: it.name, brand: it.brand, unit: it.unit, cal: it.cal, p: it.p, c: it.c, f: it.f })
          .catch((e) => alertError('復原', e)),
      },
    });
  };

  const prevDay = () => { const d = parseDk(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(dkFrom(d)); };
  const nextDay = () => { const d = parseDk(selectedDate); d.setDate(d.getDate() + 1); if (d > new Date()) return; setSelectedDate(dkFrom(d)); };

  return (
    <div style={{ padding: '6px 18px 20px' }}>
      {/* 頂部標頭 */}
      <header style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', lineHeight: 1.2, margin: 0 }}>TY Calorie Tracker</h1>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700, marginTop: 4 }}>{greeting()}{displayName ? `，${displayName}` : ''}</div>
      </header>

      {/* 日期切換列 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <button aria-label="前一天" className="tap" onClick={prevDay} style={{ border: 'none', background: 'var(--surface)', color: 'var(--text)', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: 20, fontWeight: 900, lineHeight: 1, boxShadow: '0 4px 12px -8px rgba(0,0,0,.2)' }}><Icon name="chevron-left" size={14} /></button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)' }}>{dateLabel(selectedDate)}</div>
          {isTod && <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary-ink)', marginTop: 2 }}>今天</div>}
          {!isTod && <button onClick={() => setSelectedDate(todayKey())} style={{ border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 14, cursor: 'pointer', marginTop: 3 }}>回到今天</button>}
        </div>
        <button aria-label="後一天" className="tap" onClick={nextDay} disabled={isTod} style={{ border: 'none', background: 'var(--surface)', color: 'var(--text)', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: 20, fontWeight: 900, lineHeight: 1, opacity: isTod ? 0.3 : 1, boxShadow: '0 4px 12px -8px rgba(0,0,0,.2)' }}><Icon name="chevron-right" size={14} /></button>
      </div>

      {/* 卡路里環卡片 */}
      <div style={{ background: 'var(--surface)', borderRadius: 28, padding: '24px 20px 20px', marginTop: 12, boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 700 }}>每日消耗進度</div>
        </div>
        <div style={{ position: 'relative', width: 190, height: 190, margin: '6px auto' }}>
          <svg width="190" height="190" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="41" fill="none" stroke="var(--track)" strokeWidth="12" />
            <circle cx="50" cy="50" r="41" fill="none" stroke={ringColor} strokeWidth="12" strokeLinecap="round" pathLength="100" strokeDasharray={`${pct(consumed, goalCal)} 100`} transform="rotate(-90 50 50)" />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 44, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>{consumed}</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 700, marginTop: 3 }}>/ {goalCal} kcal</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', alignItems: 'center', marginTop: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: remainColor, background: remainBg, padding: '7px 16px', borderRadius: 20 }}>{remainText}</span>
          {activeTagChips.map((chip, i) => (
            <button key={i} onClick={onOpenAdvanced} style={{ border: 'none', background: chip.bg, color: chip.color, padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>{chip.label}</button>
          ))}
        </div>

        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {macros.map((macro) => (
            <div key={macro.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{macro.label}</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700 }}>{macro.t} / {macro.g} g</span>
              </div>
              <div style={{ height: 9, borderRadius: 10, background: 'var(--track)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct(macro.t, macro.g)}%`, background: macro.color, borderRadius: 10 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 五個餐別卡片 */}
      {meals.map((meal) => (
        <div key={meal.key} style={{ background: 'var(--surface)', borderRadius: 20, padding: '15px 16px 13px', marginTop: 10, boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: meal.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, lineHeight: 1 }}>{meal.icon}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--text)', lineHeight: 1.1 }}>{meal.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)', fontWeight: 700, marginTop: 2 }}>{Math.round(meal.subtotal)} kcal</div>
              </div>
            </div>
            <button onClick={() => onOpenSheet(meal.key)} style={{ border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 800, fontSize: 13, padding: '8px 14px', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="plus" size={14} />加入</button>
          </div>
          {meal.isEmpty && <div style={{ fontSize: 13, color: 'var(--text-faint)', padding: '10px 2px 0', fontWeight: 700 }}>{meal.eh}</div>}
          {meal.items.map((it) => (
            <div key={it.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0 1px', marginTop: 8, borderTop: '1px solid var(--line)' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{it.name}</span>
                  {it.brand && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>· {it.brand}</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 1, fontWeight: 600 }}>{it.unit}</div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 1, fontWeight: 700 }}>蛋 {Math.round(Number(it.p) || 0)} · 碳 {Math.round(Number(it.c) || 0)} · 脂 {Math.round(Number(it.f) || 0)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{Math.round(Number(it.cal) || 0)}</span>
                <button aria-label="編輯這筆餐點" className="tap" onClick={() => setEditing({ mealKey: meal.key, mealLabel: meal.label, item: it })} style={{ border: 'none', background: 'var(--bg)', color: 'var(--text-muted)', width: 25, height: 25, borderRadius: '50%', cursor: 'pointer', fontSize: 12 }}><Icon name="pencil" size={14} /></button>
                <button aria-label="刪除這筆餐點" className="tap" onClick={() => deleteItem(meal, it)} style={{ border: 'none', background: 'var(--bg)', color: 'var(--text-faint)', width: 25, height: 25, borderRadius: '50%', cursor: 'pointer', fontSize: 15, lineHeight: 1 }}><Icon name="x" size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* 當日 AI 摘要（有內容才顯示）*/}
      {curDay.dayNote && (
        <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '14px 16px', marginTop: 10, boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="clipboard" size={16} />今日摘要</div>
            <button onClick={onOpenAdvanced} style={{ border: 'none', background: 'var(--bg)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="pencil" size={12} />編輯</button>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{curDay.dayNote}</div>
        </div>
      )}

      {/* 進階設定入口 */}
      <button onClick={onOpenAdvanced} style={{ width: '100%', marginTop: 10, border: 'none', background: 'var(--sunken)', color: 'var(--text-muted)', fontWeight: 800, fontSize: 14, padding: '13px 18px', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Icon name="sliders" size={16} />
        <span>進階設定</span>
        {activeTags.length > 0 && <span style={{ background: 'var(--info)', color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: 12, fontWeight: 900 }}>{activeTags.length} 標籤</span>}
        {curDay.dayNote && <span style={{ background: 'var(--info-bg)', color: 'var(--info-ink)', borderRadius: 10, padding: '1px 8px', fontSize: 12, fontWeight: 900 }}>摘要</span>}
      </button>

      {editing && (
        <EditMealItemSheet
          item={editing.item}
          mealLabel={editing.mealLabel}
          onClose={() => setEditing(null)}
          onSave={(patch) => editMeal(selectedDate, editing.mealKey, editing.item.id, patch)}
        />
      )}
    </div>
  );
}
