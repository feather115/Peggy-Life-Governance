// Report page "Diet History" card: searches which days a specific food was consumed, or views what is usually eaten for each meal.
// Each expanded record can be edited directly (modifies the value for that day) or copied to the food library.
// The destination of copying is the "food library" rather than "today", as the historical record itself might be deleted later, while keeping it in the menu preserves it.
import React, { useState, useMemo } from 'react';
import { MEALS_DEF } from '../constants.js';
import { buildFoodHistory, mealTypeBreakdown } from '../selectors.js';
import { dateLabel, alertError } from '../utils.js';
import EditMealItemSheet from './EditMealItemSheet.jsx';
import Icon from '@peggy-life/shared/Icon.jsx';
import { UI } from '@peggy-life/shared/ui';

const S = {
  card: { ...UI.card, margin: '12px 20px 0', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 },
  searchIcon: { position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' },
  hint: { fontSize: 13, color: 'var(--text-faint)' },
  list: { display: 'flex', flexDirection: 'column' },
  foodBtn: { ...UI.row, padding: '12px 0', minHeight: 0, justifyContent: 'space-between' },
  toggle: { display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 13, fontWeight: 500, color: 'var(--primary-ink)', flexShrink: 0 },
  entries: { display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto', paddingBottom: 12 },
  entry: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: 'var(--sunken)', borderRadius: 10, padding: '8px 8px 8px 12px' },
  entryTitle: { fontSize: 13, fontWeight: 500, color: 'var(--text)' },
  entryMeta: { fontSize: 12, color: 'var(--text-muted)', marginTop: 1, ...UI.num },
  smallBtn: { width: 32, height: 32, padding: 0, border: 'none', borderRadius: 999, background: 'var(--surface)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  copied: { fontSize: 12, fontWeight: 500, color: 'var(--primary-ink)', display: 'inline-flex', alignItems: 'center', gap: 4 },
  mealChips: { display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 },
  rankRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 0' },
  rankNo: { fontSize: 13, fontWeight: 600, color: 'var(--text-faint)', width: 20, flexShrink: 0, ...UI.num },
};

export default function FoodHistoryCard({ app }) {
  const { days, editMeal, addCustomFood } = app;
  const [tab, setTab] = useState('search'); // 'search' | 'byMeal'
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [mealKey, setMealKey] = useState('breakfast');
  const [editing, setEditing] = useState(null); // { date, mealKey, item } | null
  const [copiedKey, setCopiedKey] = useState(null); // Displays the item marked "added to menu"

  const history = useMemo(() => buildFoodHistory(days), [days]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return history.filter((f) => f.name.toLowerCase().includes(q)).sort((a, b) => b.count - a.count);
  }, [history, query]);
  const byMeal = useMemo(() => mealTypeBreakdown(days, mealKey), [days, mealKey]);

  const copyToMenu = async (entry, entryKey) => {
    const it = entry.item;
    try {
      await addCustomFood({ name: it.name, brand: it.brand || '', note: '', unit: it.unit, cal: it.cal, p: it.p || 0, c: it.c || 0, f: it.f || 0 });
    } catch (e) {
      alertError('加入食物庫', e);
      return;
    }
    setCopiedKey(entryKey);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <section style={S.card}>
      <h2 style={UI.sectionTitle}>飲食歷史</h2>
      <div style={UI.segTrack}>
        <button type="button" aria-pressed={tab === 'search'} onClick={() => setTab('search')} style={UI.seg(tab === 'search')}>搜尋食物</button>
        <button type="button" aria-pressed={tab === 'byMeal'} onClick={() => setTab('byMeal')} style={UI.seg(tab === 'byMeal')}>依餐別統計</button>
      </div>

      {tab === 'search' && (
        <>
          <div style={{ position: 'relative' }}>
            <Icon name="search" size={18} style={S.searchIcon} />
            <input aria-label="搜尋食物名稱" value={query} onChange={(e) => { setQuery(e.target.value); setExpanded(null); }} placeholder="輸入食物名稱，例如：雞胸肉"
              style={{ ...UI.input, paddingLeft: 40 }} />
          </div>
          {query.trim() && filtered.length === 0 && <div style={S.hint}>沒有找到符合的食物</div>}
          {!query.trim() && <div style={S.hint}>輸入名稱看看哪幾天吃過這個食物</div>}
          {filtered.length > 0 && (
            <div style={S.list}>
              {filtered.map((f, i) => (
                <div key={f.name} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}>
                  <button type="button" aria-expanded={expanded === f.name} onClick={() => setExpanded(expanded === f.name ? null : f.name)} style={S.foodBtn}>
                    <span style={UI.rowText}>
                      <span style={UI.rowTitle}>{f.name}</span>
                      <span style={UI.rowMeta}>吃過 {f.count} 次 · 最近 {dateLabel(f.lastDate)}</span>
                    </span>
                    <span style={S.toggle}>{expanded === f.name ? '收合' : '看日期'}<Icon name="chevron-right" size={16} style={{ transform: expanded === f.name ? 'rotate(-90deg)' : 'rotate(90deg)' }} /></span>
                  </button>
                  {expanded === f.name && (
                    <div style={S.entries}>
                      {f.entries.slice().reverse().map((e) => {
                        const entryKey = `${e.date}-${e.mealKey}-${e.item.id}`;
                        return (
                          <div key={entryKey} style={S.entry}>
                            <div style={{ minWidth: 0 }}>
                              <div style={S.entryTitle}>{dateLabel(e.date)} · {MEALS_DEF.find((m) => m.key === e.mealKey)?.label}</div>
                              <div style={S.entryMeta}>{Math.round(e.item.cal)} kcal</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                              {copiedKey === entryKey
                                ? <span style={S.copied}><Icon name="check" size={14} strokeWidth={2} />已加入食物庫</span>
                                : <button type="button" aria-label="複製到食物庫" title="複製到食物庫" onClick={() => copyToMenu(e, entryKey)} style={{ ...S.smallBtn, color: 'var(--primary-ink)' }}><Icon name="copy" size={16} /></button>}
                              <button type="button" aria-label="編輯這筆" title="編輯這筆" onClick={() => setEditing({ date: e.date, mealKey: e.mealKey, item: e.item })} style={S.smallBtn}><Icon name="pencil" size={16} /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'byMeal' && (
        <>
          <div className="ps" style={S.mealChips}>
            {MEALS_DEF.map((m) => (
              <button key={m.key} type="button" aria-pressed={mealKey === m.key} onClick={() => setMealKey(m.key)} style={UI.chip(mealKey === m.key)}>{m.label}</button>
            ))}
          </div>
          {byMeal.length === 0 && <div style={S.hint}>這個餐別還沒有記錄</div>}
          {byMeal.length > 0 && (
            <div style={S.list}>
              {byMeal.slice(0, 15).map((f, i) => (
                <div key={f.name} style={{ ...S.rankRow, borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span style={S.rankNo}>{i + 1}</span>
                    <span style={UI.rowTitle}>{f.name}</span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--primary-ink)' }}>{f.count} 次</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', ...UI.num }}>平均 {Math.round(f.totalCal / f.count)} kcal</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {editing && (
        <EditMealItemSheet
          item={editing.item}
          mealLabel={MEALS_DEF.find((m) => m.key === editing.mealKey)?.label || ''}
          onClose={() => setEditing(null)}
          onSave={(patch) => editMeal(editing.date, editing.mealKey, editing.item.id, patch)}
        />
      )}
    </section>
  );
}
