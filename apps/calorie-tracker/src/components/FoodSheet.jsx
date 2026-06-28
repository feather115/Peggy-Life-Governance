// Food library bottom sheet: select built-in/custom food to add to meal, or switch to the form to add new custom foods.
import React, { useState } from 'react';
import { FOODS, MEALS_DEF } from '../constants.js';
import Sheet from './Sheet.jsx';

export default function FoodSheet({ app, selectedDate, mealKey, onClose }) {
  const { customFoods, foodUsage, addMeal, addCustomFood, removeCustomFood, updateCustomFood } = app;
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // ID of the custom food being edited; null = creation mode
  const [form, setForm] = useState({ name: '', brand: '', note: '', unit: '1 份', cal: '', p: '', c: '', f: '' });
  const [aiQuery, setAiQuery] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState('');
  const [qtyMap, setQtyMap] = useState({}); // Currently selected servings for each food, defaults to 1

  const isMid = mealKey === 'midnight';
  const mealLabel = MEALS_DEF.find((m) => m.key === mealKey)?.label || '';

  // Food list: built-in + custom; sorted by calories ascending for midnight meal, other meals sorted by "last used/added/edited" timestamp descending (most recent on top).
  let list = [...FOODS, ...customFoods];
  if (isMid) {
    list = [...list].sort((a, b) => a.cal - b.cal);
  } else {
    list = [...list].sort((a, b) => {
      const ta = foodUsage[a.id], tb = foodUsage[b.id];
      if (ta && tb) return tb.localeCompare(ta);
      if (ta) return -1;
      if (tb) return 1;
      return 0;
    });
  }

  const fcn = parseFloat(form.cal);
  const canSave = !!form.name.trim() && !isNaN(fcn) && fcn >= 0;
  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Serving selection: e.g. recipe is "1 serving", but today consumed 2 servings, or only 0.3 servings; decimal numbers can be input directly.
  const getQty = (id) => qtyMap[id] ?? 1;
  const setQty = (id, v) => setQtyMap((q) => ({ ...q, [id]: Math.max(0.1, round1(v)) }));
  const round1 = (n) => Math.round(n * 10) / 10;

  // Add existing food (multiplies nutritional values by current servings, builds a snapshot, and passes it to app.addMeal)
  const pick = (fo) => {
    const qty = getQty(fo.id);
    addMeal(selectedDate, mealKey, {
      foodRef: fo.id, name: fo.name, brand: fo.brand || '',
      unit: qty === 1 ? fo.unit : `${qty} × ${fo.unit}`,
      cal: Math.round(fo.cal * qty), p: round1((fo.p || 0) * qty), c: round1((fo.c || 0) * qty), f: round1((fo.f || 0) * qty),
    });
    setQty(fo.id, 1);
  };

  const startEdit = (fo) => {
    setEditingId(fo.id);
    setForm({ name: fo.name, brand: fo.brand || '', note: fo.note || '', unit: fo.unit, cal: String(fo.cal), p: String(fo.p || ''), c: String(fo.c || ''), f: String(fo.f || '') });
    setAiQuery(''); setAiError('');
    setFormOpen(true);
  };

  // Describe food in one sentence, AI estimates nutritional values and populates the form below, which the user can still manually edit before submitting.
  const aiSearch = async () => {
    if (!aiQuery.trim() || aiBusy) return;
    setAiBusy(true); setAiError('');
    try {
      const res = await fetch('/api/food-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiQuery.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '查詢失敗');
      setForm({ name: data.name, brand: data.brand, note: data.note, unit: data.unit, cal: String(data.cal), p: String(data.p), c: String(data.c), f: String(data.f) });
    } catch (e) {
      setAiError(e.message || '查詢失敗');
    } finally {
      setAiBusy(false);
    }
  };

  // Creation mode: once saved, added directly to the current meal; Edit mode: only modifies the definition, not affecting previously recorded historical meal items (snapshot).
  const save = async () => {
    if (!canSave) return;
    const payload = { name: form.name.trim(), brand: form.brand.trim(), note: form.note.trim(), unit: form.unit.trim() || '1 份', cal: Math.round(fcn), p: parseFloat(form.p) || 0, c: parseFloat(form.c) || 0, f: parseFloat(form.f) || 0 };
    if (editingId) {
      await updateCustomFood(editingId, payload);
    } else {
      const nf = await addCustomFood(payload);
      await addMeal(selectedDate, mealKey, { foodRef: nf.id, name: nf.name, brand: nf.brand, unit: nf.unit, cal: nf.cal, p: nf.p, c: nf.c, f: nf.f });
    }
    setEditingId(null);
    setFormOpen(false);
  };

  return (
    <Sheet onBackdrop={onClose} height="min(76vh, 720px)" zIndex={10}>
      <div style={{ padding: '8px 20px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 900, color: '#234034' }}>加入{mealLabel}</span>
        <button onClick={onClose} style={{ border: 'none', background: '#2E8B5E', color: '#fff', fontWeight: 800, fontSize: 14, padding: '8px 16px', borderRadius: 18, cursor: 'pointer' }}>完成</button>
      </div>

      {isMid && (
        <div style={{ margin: '4px 18px 0', background: '#FFF6E6', borderRadius: 14, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🌙</span>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#8B5A00' }}>宵夜挑輕一點吧，已按低卡排序</div>
        </div>
      )}

      {!formOpen && (
        <div className="ps" style={{ flex: 1, overflowY: 'auto', padding: '6px 16px 20px' }}>
          <button onClick={() => { setEditingId(null); setFormOpen(true); setForm({ name: '', brand: '', note: '', unit: '1 份', cal: '', p: '', c: '', f: '' }); setAiQuery(''); setAiError(''); }} style={{ width: '100%', border: '2px dashed #B7D5C2', background: '#F6FAF7', borderRadius: 16, padding: '12px 14px', marginTop: 7, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#2E8B5E', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, lineHeight: 1, flex: 'none' }}>＋</div>
            <div><div style={{ fontSize: 14, fontWeight: 800, color: '#234034' }}>新增自訂食物</div><div style={{ fontSize: 12, color: '#6E8B7C', marginTop: 1, fontWeight: 600 }}>輸入名稱、卡路里、營養素</div></div>
          </button>
          {list.map((fo) => (
            <div key={fo.id} style={{ background: '#F6FAF7', borderRadius: 16, padding: '11px 13px', marginTop: 7 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#234034' }}>{fo.name}</span>
                    {fo.brand && <span style={{ fontSize: 11, color: '#6E8B7C', fontWeight: 600 }}>· {fo.brand}</span>}
                    {fo.custom && <span style={{ fontSize: 10, fontWeight: 800, color: '#2E8B5E', background: '#DCEDE3', padding: '2px 6px', borderRadius: 6 }}>自訂</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#9bb0a3', marginTop: 1, fontWeight: 600 }}>{fo.unit} · {fo.cal} kcal</div>
                  {fo.note && <div style={{ fontSize: 11, color: '#9bb0a3', marginTop: 2, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📝 {fo.note}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 'none' }}>
                  {fo.custom && <button onClick={() => startEdit(fo)} style={{ border: 'none', background: '#fff', color: '#6E8B7C', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 13 }}>✏</button>}
                  {fo.custom && <button onClick={() => removeCustomFood(fo.id)} style={{ border: 'none', background: '#fff', color: '#bcccc2', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>×</button>}
                  <button onClick={() => pick(fo)} style={{ border: 'none', background: '#2E8B5E', color: '#fff', width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', fontSize: 18, lineHeight: 1, fontWeight: 700 }}>＋</button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, paddingTop: 8, borderTop: '1px solid #EEF4F0' }}>
                <span style={{ fontSize: 11, color: '#9bb0a3', fontWeight: 700 }}>份數</span>
                <button onClick={() => setQty(fo.id, getQty(fo.id) - 0.5)} style={{ border: 'none', background: '#fff', color: '#6E8B7C', width: 24, height: 24, borderRadius: '50%', cursor: 'pointer', fontSize: 14, fontWeight: 800, lineHeight: 1 }}>−</button>
                <input type="number" inputMode="decimal" step="0.1" min="0.1" value={getQty(fo.id)}
                  onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) setQty(fo.id, v); }}
                  style={{ width: 48, textAlign: 'center', border: 'none', background: '#fff', borderRadius: 8, padding: '4px 2px', fontSize: 14, fontWeight: 900, color: '#234034' }} />
                <button onClick={() => setQty(fo.id, getQty(fo.id) + 0.5)} style={{ border: 'none', background: '#fff', color: '#6E8B7C', width: 24, height: 24, borderRadius: '50%', cursor: 'pointer', fontSize: 14, fontWeight: 800, lineHeight: 1 }}>＋</button>
                {getQty(fo.id) !== 1 && <span style={{ fontSize: 11, color: '#2E8B5E', fontWeight: 700 }}>＝ {Math.round(fo.cal * getQty(fo.id))} kcal</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <div className="ps" style={{ flex: 1, overflowY: 'auto', padding: '6px 20px 20px' }}>
          <button onClick={() => { setFormOpen(false); setEditingId(null); }} style={{ border: 'none', background: 'none', color: '#6E8B7C', fontWeight: 800, fontSize: 14, padding: '4px 0', cursor: 'pointer' }}>‹ 回到食物庫</button>
          {editingId && <div style={{ marginTop: 4, fontSize: 12, color: '#9bb0a3', fontWeight: 700 }}>修改不會影響已經記錄過的歷史餐點</div>}

          <div style={{ marginTop: 10, background: '#F0F3F1', borderRadius: 14, padding: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#2E8B5E', marginBottom: 6 }}>✨ AI 搜尋（用一句話描述，自動帶入下面欄位）</div>
            <form onSubmit={(e) => { e.preventDefault(); aiSearch(); }} style={{ display: 'flex', gap: 8 }}>
              <input type="search" enterKeyHint="search" value={aiQuery} onChange={(e) => setAiQuery(e.target.value)}
                placeholder="例如：7-11 御飯糰 鮭魚"
                style={{ flex: 1, minWidth: 0, border: 'none', background: '#fff', borderRadius: 12, padding: '12px 14px', fontSize: 16, fontWeight: 700, color: '#234034' }} />
              <button type="submit" disabled={aiBusy || !aiQuery.trim()}
                style={{ border: 'none', background: aiBusy ? '#C7D6CC' : '#2E8B5E', color: '#fff', fontWeight: 800, fontSize: 14, padding: '0 16px', borderRadius: 12, cursor: 'pointer', flexShrink: 0 }}>{aiBusy ? '查詢中…' : '搜尋'}</button>
            </form>
            {aiError && <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: '#B91C1C' }}>{aiError}</div>}
          </div>

          <div style={{ marginTop: 14, fontSize: 13, fontWeight: 800, color: '#6E8B7C' }}>食物名稱</div>
          <input type="text" value={form.name} onChange={setField('name')} placeholder="例如：媽媽的炒飯" style={{ width: '100%', marginTop: 5, border: 'none', background: '#F6FAF7', borderRadius: 12, padding: '12px 14px', fontSize: 16, fontWeight: 700, color: '#234034' }} />
          <div style={{ marginTop: 12, fontSize: 13, fontWeight: 800, color: '#6E8B7C' }}>品牌（選填）</div>
          <input type="text" value={form.brand} onChange={setField('brand')} placeholder="例如：7-11" style={{ width: '100%', marginTop: 5, border: 'none', background: '#F6FAF7', borderRadius: 12, padding: '12px 14px', fontSize: 16, fontWeight: 700, color: '#234034' }} />
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 800, color: '#6E8B7C' }}>份量</div><input type="text" value={form.unit} onChange={setField('unit')} placeholder="1 碗" style={{ width: '100%', marginTop: 5, border: 'none', background: '#F6FAF7', borderRadius: 12, padding: 12, fontSize: 16, fontWeight: 700, color: '#234034' }} /></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 800, color: '#6E8B7C' }}>卡路里</div><input type="number" inputMode="numeric" value={form.cal} onChange={setField('cal')} placeholder="450" style={{ width: '100%', marginTop: 5, border: 'none', background: '#F6FAF7', borderRadius: 12, padding: 12, fontSize: 16, fontWeight: 700, color: '#234034' }} /></div>
          </div>
          <div style={{ marginTop: 14, fontSize: 13, fontWeight: 800, color: '#6E8B7C' }}>三大營養素 (g) · 可留空</div>
          <div style={{ marginTop: 5, display: 'flex', gap: 8 }}>
            {[{ key: 'p', label: '蛋白質', color: '#2E8B5E' }, { key: 'c', label: '碳水', color: '#E8A13C' }, { key: 'f', label: '脂肪', color: '#5FA8D3' }].map((m) => (
              <div key={m.key} style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: m.color, marginBottom: 3 }}>{m.label}</div>
                <input type="number" inputMode="decimal" value={form[m.key]} onChange={setField(m.key)} placeholder="0" style={{ width: '100%', border: 'none', background: '#F6FAF7', borderRadius: 12, padding: '12px 10px', fontSize: 16, fontWeight: 700, color: '#234034' }} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, fontSize: 13, fontWeight: 800, color: '#6E8B7C' }}>備註（選填）</div>
          <textarea value={form.note} onChange={setField('note')} placeholder="例如：去冰半糖、不要香菜" rows={2}
            style={{ width: '100%', marginTop: 5, border: 'none', background: '#F6FAF7', borderRadius: 12, padding: '12px 14px', fontSize: 16, fontWeight: 700, color: '#234034', fontFamily: 'inherit', resize: 'none' }} />
          <button onClick={save} disabled={!canSave} style={{ width: '100%', marginTop: 18, border: 'none', background: canSave ? '#2E8B5E' : '#C7D6CC', color: '#fff', fontWeight: 900, fontSize: 14, padding: 14, borderRadius: 16, cursor: 'pointer' }}>{editingId ? '儲存修改' : `儲存並加入${mealLabel}`}</button>
        </div>
      )}
    </Sheet>
  );
}
