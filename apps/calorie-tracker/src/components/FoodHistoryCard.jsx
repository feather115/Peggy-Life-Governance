// Report page "Diet History" card: searches which days a specific food was consumed, or views what is usually eaten for each meal.
// Each expanded record can be edited directly (modifies the value for that day) or copied to the food library.
// The destination of copying is the "food library" rather than "today", as the historical record itself might be deleted later, while keeping it in the menu preserves it.
import React, { useState, useMemo } from 'react';
import { MEALS_DEF } from '../constants.js';
import { buildFoodHistory, mealTypeBreakdown } from '../selectors.js';
import { dateLabel } from '../utils.js';
import EditMealItemSheet from './EditMealItemSheet.jsx';

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
    await addCustomFood({ name: it.name, brand: it.brand || '', note: '', unit: it.unit, cal: it.cal, p: it.p || 0, c: it.c || 0, f: it.f || 0 });
    setCopiedKey(entryKey);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div style={{ background: '#fff', borderRadius: 24, padding: '20px 16px', marginTop: 12, boxShadow: '0 10px 24px -18px rgba(46,139,94,.5)' }}>
      <div style={{ fontSize: 16, fontWeight: 900, color: '#234034', marginBottom: 12 }}>🔍 飲食歷史</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <button onClick={() => setTab('search')} style={tabBtn(tab === 'search')}>搜尋食物</button>
        <button onClick={() => setTab('byMeal')} style={tabBtn(tab === 'byMeal')}>依餐別統計</button>
      </div>

      {tab === 'search' && (
        <div>
          <input value={query} onChange={(e) => { setQuery(e.target.value); setExpanded(null); }} placeholder="輸入食物名稱，例如：雞胸肉"
            style={{ width: '100%', border: 'none', background: '#F6FAF7', borderRadius: 14, padding: '12px 14px', fontSize: 16, fontWeight: 700, color: '#234034' }} />
          {query.trim() && filtered.length === 0 && <div style={{ marginTop: 12, fontSize: 13, color: '#9bb0a3', fontWeight: 600 }}>沒有找到符合的食物</div>}
          {!query.trim() && <div style={{ marginTop: 12, fontSize: 12, color: '#bcccc2', fontWeight: 600 }}>輸入名稱看看哪幾天吃過這個食物</div>}
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((f) => (
              <div key={f.name} style={{ background: '#F6FAF7', borderRadius: 14, padding: '12px 14px' }}>
                <div onClick={() => setExpanded(expanded === f.name ? null : f.name)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#234034' }}>{f.name}</div>
                    <div style={{ fontSize: 12, color: '#9bb0a3', marginTop: 2, fontWeight: 600 }}>吃過 {f.count} 次 · 最近 {dateLabel(f.lastDate)}</div>
                  </div>
                  <span style={{ fontSize: 12, color: '#2E8B5E', fontWeight: 800, flexShrink: 0 }}>{expanded === f.name ? '收合 ▲' : '看日期 ▼'}</span>
                </div>
                {expanded === f.name && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #EAF2EC', display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
                    {f.entries.slice().reverse().map((e, i) => {
                      const entryKey = `${e.date}-${e.mealKey}-${e.item.id}`;
                      return (
                        <div key={entryKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: '#fff', borderRadius: 10, padding: '8px 10px' }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12, color: '#234034', fontWeight: 700 }}>{dateLabel(e.date)} · {MEALS_DEF.find((m) => m.key === e.mealKey)?.label}</div>
                            <div style={{ fontSize: 11, color: '#9bb0a3', fontWeight: 600, marginTop: 1 }}>{Math.round(e.item.cal)} kcal</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                            {copiedKey === entryKey
                              ? <span style={{ fontSize: 11, color: '#2E8B5E', fontWeight: 800 }}>已加入菜單 ✓</span>
                              : <button onClick={() => copyToMenu(e, entryKey)} title="複製到食物庫菜單" style={{ border: 'none', background: '#EAF5EE', color: '#2E8B5E', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', fontSize: 12 }}>📋</button>}
                            <button onClick={() => setEditing({ date: e.date, mealKey: e.mealKey, item: e.item })} title="編輯這筆" style={{ border: 'none', background: '#EAF5EE', color: '#6E8B7C', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', fontSize: 12 }}>✏</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'byMeal' && (
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 2 }}>
            {MEALS_DEF.map((m) => (
              <button key={m.key} onClick={() => setMealKey(m.key)} style={{ ...tabBtn(mealKey === m.key), flexShrink: 0 }}>{m.icon} {m.label}</button>
            ))}
          </div>
          {byMeal.length === 0 && <div style={{ fontSize: 13, color: '#9bb0a3', fontWeight: 600 }}>這個餐別還沒有記錄</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {byMeal.slice(0, 15).map((f, i) => (
              <div key={f.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F6FAF7', borderRadius: 14, padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 900, color: '#9bb0a3', width: 18, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#234034' }}>{f.name}</span>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#2E8B5E' }}>{f.count} 次</div>
                  <div style={{ fontSize: 11, color: '#9bb0a3', fontWeight: 600 }}>平均 {Math.round(f.totalCal / f.count)} kcal</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editing && (
        <EditMealItemSheet
          item={editing.item}
          mealLabel={MEALS_DEF.find((m) => m.key === editing.mealKey)?.label || ''}
          onClose={() => setEditing(null)}
          onSave={(patch) => editMeal(editing.date, editing.mealKey, editing.item.id, patch)}
        />
      )}
    </div>
  );
}

const tabBtn = (active) => ({
  border: 'none', background: active ? '#2E8B5E' : '#F0F3F1', color: active ? '#fff' : '#6E8B7C',
  fontWeight: 800, fontSize: 13, padding: '8px 14px', borderRadius: 12, cursor: 'pointer',
});
