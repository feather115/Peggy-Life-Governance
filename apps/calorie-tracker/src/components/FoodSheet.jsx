// Food library bottom sheet: select built-in/custom food to add to meal, or switch to the form to add new custom foods.
import React, { useState } from 'react';
import { FOODS, MEALS_DEF } from '../constants.js';
import Sheet from './Sheet.jsx';
import Icon from '@peggy-life/shared/Icon.jsx';
import { confirmDialog, toast } from '@peggy-life/shared/feedback.jsx';

export default function FoodSheet({ app, selectedDate, mealKey, onClose }) {
  const { customFoods, foodUsage, addMeal, addCustomFood, removeCustomFood, updateCustomFood, importFoods } = app;
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // ID of the custom food being edited; null = creation mode
  const [formMode, setFormMode] = useState('manual');
  const [form, setForm] = useState({ name: '', brand: '', note: '', unit: '1 份', cal: '', p: '', c: '', f: '' });
  const [aiQuery, setAiQuery] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [jsonSuccess, setJsonSuccess] = useState(0);
  const [qtyMap, setQtyMap] = useState({}); // Currently selected servings for each food, defaults to 1
  const [search, setSearch] = useState('');
  // 成功/失敗提示改用三個 app 共用的 toast（畫面底部）
  const showToast = (message, isError = false) => toast(isError ? message : `✓ ${message}`, { tone: isError ? 'error' : 'default' });

  const mealLabel = MEALS_DEF.find((m) => m.key === mealKey)?.label || '';

  // Food list: built-in + custom; sorted by "last used/added/edited" timestamp descending (most recent on top).
  let list = [...FOODS, ...customFoods];
  list = [...list].sort((a, b) => {
    const ta = foodUsage[a.id], tb = foodUsage[b.id];
    if (ta && tb) return tb.localeCompare(ta);
    if (ta) return -1;
    if (tb) return 1;
    return 0;
  });
  const kw = search.trim().toLowerCase();
  if (kw) list = list.filter((fo) => [fo.name, fo.brand, fo.note].some((s) => s && s.toLowerCase().includes(kw)));

  const fcn = parseFloat(form.cal);
  const canSave = !!form.name.trim() && !isNaN(fcn) && fcn >= 0;
  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const resetForm = () => {
    setForm({ name: '', brand: '', note: '', unit: '1 份', cal: '', p: '', c: '', f: '' });
    setAiQuery('');
    setAiError('');
  };
  const openCreateForm = (mode = 'manual') => {
    setEditingId(null);
    setFormMode(mode);
    resetForm();
    setJsonText('');
    setJsonError('');
    setJsonSuccess(0);
    setFormOpen(true);
  };

  // Serving selection: e.g. recipe is "1 serving", but today consumed 2 servings, or only 0.3 servings; decimal numbers can be input directly.
  // getQtyRaw can be '' while the user is clearing the field to retype a new value (e.g. going from 1 to 0.3).
  const getQtyRaw = (id) => qtyMap[id] ?? 1;
  const getQtyNum = (id) => {
    const raw = getQtyRaw(id);
    const n = parseFloat(raw);
    return isNaN(n) ? NaN : n;
  };
  const setQtyRaw = (id, v) => setQtyMap((q) => ({ ...q, [id]: v }));
  const nudgeQty = (id, delta) => {
    const base = getQtyNum(id);
    const next = Math.max(0.1, round1((isNaN(base) ? 1 : base) + delta));
    setQtyRaw(id, next);
  };
  const round1 = (n) => Math.round(n * 10) / 10;

  // Add existing food (multiplies nutritional values by current servings, builds a snapshot, and passes it to app.addMeal)
  // 寫入成功才顯示「已加入」；失敗顯示錯誤並保留份數，方便重試
  const pick = async (fo) => {
    const qty = getQtyNum(fo.id);
    if (isNaN(qty) || qty <= 0) return;
    try {
      await addMeal(selectedDate, mealKey, {
        foodRef: fo.id, name: fo.name, brand: fo.brand || '',
        unit: qty === 1 ? fo.unit : `${qty} × ${fo.unit}`,
        cal: Math.round(fo.cal * qty), p: round1((fo.p || 0) * qty), c: round1((fo.c || 0) * qty), f: round1((fo.f || 0) * qty),
      });
    } catch (e) {
      showToast(`加入失敗：${e.message || '請稍後再試'}`, true);
      return;
    }
    setQtyRaw(fo.id, 1);
    showToast(`已加入 ${fo.name}`);
  };

  const startEdit = (fo) => {
    setEditingId(fo.id);
    setFormMode('manual');
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
    let nf = null;
    try {
      if (editingId) await updateCustomFood(editingId, payload);
      else nf = await addCustomFood(payload);
    } catch (e) {
      showToast(`儲存失敗：${e.message || '請稍後再試'}`, true);
      return;
    }
    // 食物已經存進食物庫就先關表單（留著的話再按一次儲存會重複建立），再加入餐點
    setEditingId(null);
    setFormOpen(false);
    if (!nf) { showToast(`已更新 ${payload.name}`); return; }
    try {
      await addMeal(selectedDate, mealKey, { foodRef: nf.id, name: nf.name, brand: nf.brand, unit: nf.unit, cal: nf.cal, p: nf.p, c: nf.c, f: nf.f });
      showToast(`已加入 ${payload.name}`);
    } catch (e) {
      showToast(`已存進食物庫，但加入${mealLabel}失敗：${e.message || '請稍後再試'}`, true);
    }
  };

  const importJsonFoods = async () => {
    try {
      const raw = jsonText.trim();
      if (!raw) { setJsonError('請先貼上 JSON 內容'); return; }
      let arr = JSON.parse(raw);
      if (!Array.isArray(arr)) arr = [arr];
      const valid = [];
      arr.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        const name = (item.name || '').trim();
        const cal = parseFloat(item.cal || item.calories || item.kcal || 0);
        if (!name || isNaN(cal) || cal < 0) return;
        valid.push({
          name,
          unit: (item.unit || item.serving || '1 份').toString().trim(),
          cal: Math.round(cal),
          p: parseFloat(item.p || item.protein || 0) || 0,
          c: parseFloat(item.c || item.carb || item.carbs || item.carbohydrate || 0) || 0,
          f: parseFloat(item.f || item.fat || 0) || 0,
          brand: (item.brand || '').toString().trim(),
          note: (item.note || item.notes || '').toString().trim(),
        });
      });
      if (valid.length === 0) { setJsonError('沒找到有效食物，請確認有 name 和 cal'); return; }
      const addedFoods = await importFoods(valid);
      await Promise.all(addedFoods.map((fo) => addMeal(selectedDate, mealKey, {
        foodRef: fo.id,
        name: fo.name,
        brand: fo.brand || '',
        unit: fo.unit,
        cal: fo.cal,
        p: fo.p,
        c: fo.c,
        f: fo.f,
      })));
      setJsonSuccess(addedFoods.length);
      setJsonError('');
      showToast(`已加入 ${addedFoods.length} 筆到${mealLabel}`);
    } catch (e) {
      setJsonError('匯入失敗：' + (e.message || ''));
    }
  };

  return (
    <Sheet label="食物庫" onBackdrop={onClose} height="min(76vh, 720px)" zIndex={10}>
      <div style={{ padding: '8px 20px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)' }}>加入{mealLabel}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {formOpen && (
            <button onClick={save} disabled={!canSave} style={{ border: 'none', background: canSave ? 'var(--primary)' : 'var(--line-strong)', color: '#fff', fontWeight: 800, fontSize: 14, padding: '8px 16px', borderRadius: 18, cursor: canSave ? 'pointer' : 'not-allowed' }}>{editingId ? '儲存修改' : `儲存並加入${mealLabel}`}</button>
          )}
          <button onClick={onClose} style={{ border: 'none', background: formOpen ? 'var(--sunken)' : 'var(--primary)', color: formOpen ? 'var(--text-muted)' : '#fff', fontWeight: 800, fontSize: 14, padding: '8px 16px', borderRadius: 18, cursor: 'pointer' }}>跳出</button>
        </div>
      </div>

      {!formOpen && (
        <div className="ps" style={{ flex: 1, overflowY: 'auto', padding: '6px 16px 20px' }}>
          <div style={{ position: 'relative', marginTop: 7 }}>
            <Icon name="search" size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }} />
            <input aria-label="搜尋食物" type="search" enterKeyHint="search" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="搜尋食物名稱、品牌、備註"
              style={{ width: '100%', border: 'none', background: 'var(--sunken)', borderRadius: 12, padding: '11px 36px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }} />
            {search && (
              <button aria-label="清除搜尋" className="tap" onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'var(--surface)', color: 'var(--text-muted)', width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', fontSize: 13, lineHeight: 1 }}><Icon name="x" size={14} /></button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 7 }}>
            <button onClick={() => openCreateForm('manual')} style={{ flex: 1, border: '2px dashed #B7D5C2', background: 'var(--surface-alt)', borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, lineHeight: 1, flex: 'none' }}>＋</div>
              <div><div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>新增自訂食物</div><div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1, fontWeight: 600 }}>手動輸入名稱、卡路里、營養素</div></div>
            </button>
            <button onClick={() => openCreateForm('json')} style={{ flex: '0 0 120px', border: '2px dashed #D6E5DC', background: 'var(--surface)', borderRadius: 16, padding: '12px 10px', cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--primary)', fontFamily: 'monospace' }}>{'{ }'}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)', marginTop: 3 }}>JSON 輸入</div>
            </button>
          </div>
          {kw && list.length === 0 && (
            <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: 'var(--text-faint)', fontWeight: 700 }}>找不到「{search.trim()}」，可以用上面的按鈕新增</div>
          )}
          {list.map((fo) => (
            <div key={fo.id} style={{ background: 'var(--surface-alt)', borderRadius: 16, padding: '11px 13px', marginTop: 7 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{fo.name}</span>
                    {fo.brand && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>· {fo.brand}</span>}
                    {fo.custom && <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary)', background: 'var(--track)', padding: '2px 6px', borderRadius: 6 }}>自訂</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 1, fontWeight: 600 }}>{fo.unit} · {fo.cal} kcal</div>
                  {fo.note && <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📝 {fo.note}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 'none' }}>
                  {fo.custom && <button aria-label="編輯食物" className="tap" onClick={() => startEdit(fo)} style={{ border: 'none', background: 'var(--surface)', color: 'var(--text-muted)', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 13 }}><Icon name="pencil" size={14} /></button>}
                  {fo.custom && <button aria-label="刪除食物" className="tap" onClick={async () => (await confirmDialog({ title: `刪除自訂食物「${fo.name}」？`, message: '已經記錄過的餐點不受影響。', confirmText: '刪除', danger: true })) && removeCustomFood(fo.id).catch((e) => showToast(`刪除失敗：${e.message || '請稍後再試'}`, true))} style={{ border: 'none', background: 'var(--surface)', color: 'var(--text-faint)', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}><Icon name="x" size={14} /></button>}
                  <button aria-label={`加入 ${fo.name}`} className="tap" onClick={() => pick(fo)} disabled={isNaN(getQtyNum(fo.id)) || getQtyNum(fo.id) <= 0}
                    style={{ border: 'none', background: (isNaN(getQtyNum(fo.id)) || getQtyNum(fo.id) <= 0) ? 'var(--text-faint)' : 'var(--primary)', color: '#fff', width: 34, height: 34, borderRadius: '50%', cursor: (isNaN(getQtyNum(fo.id)) || getQtyNum(fo.id) <= 0) ? 'not-allowed' : 'pointer', fontSize: 18, lineHeight: 1, fontWeight: 700 }}><Icon name="plus" size={14} /></button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--line)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-faint)', fontWeight: 700 }}>份數</span>
                <button aria-label="減少份數" className="tap" onClick={() => nudgeQty(fo.id, -0.5)} style={{ border: 'none', background: 'var(--surface)', color: 'var(--text-muted)', width: 24, height: 24, borderRadius: '50%', cursor: 'pointer', fontSize: 14, fontWeight: 800, lineHeight: 1 }}>−</button>
                <input aria-label="份數" type="number" inputMode="decimal" step="0.1" min="0.1" value={getQtyRaw(fo.id)}
                  onChange={(e) => setQtyRaw(fo.id, e.target.value)}
                  onBlur={(e) => { if (e.target.value.trim() === '') return; const n = getQtyNum(fo.id); if (!isNaN(n)) setQtyRaw(fo.id, Math.max(0.1, round1(n))); }}
                  style={{ width: 48, textAlign: 'center', border: 'none', background: 'var(--surface)', borderRadius: 8, padding: '4px 2px', fontSize: 14, fontWeight: 900, color: 'var(--text)' }} />
                <button aria-label="增加份數" className="tap" onClick={() => nudgeQty(fo.id, 0.5)} style={{ border: 'none', background: 'var(--surface)', color: 'var(--text-muted)', width: 24, height: 24, borderRadius: '50%', cursor: 'pointer', fontSize: 14, fontWeight: 800, lineHeight: 1 }}><Icon name="plus" size={14} /></button>
                {!isNaN(getQtyNum(fo.id)) && getQtyNum(fo.id) > 0 && getQtyNum(fo.id) !== 1 && <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700 }}>＝ {Math.round(fo.cal * getQtyNum(fo.id))} kcal</span>}
                {(isNaN(getQtyNum(fo.id)) || getQtyNum(fo.id) <= 0) && <span style={{ fontSize: 12, color: '#C97B3D', fontWeight: 700 }}>請輸入份數</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <div className="ps" style={{ flex: 1, overflowY: 'auto', padding: '6px 20px 20px' }}>
          <button onClick={() => { setFormOpen(false); setEditingId(null); }} style={{ border: 'none', background: 'none', color: 'var(--text-muted)', fontWeight: 800, fontSize: 14, padding: '4px 0', cursor: 'pointer' }}>‹ 回到食物庫</button>
          {editingId && <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-faint)', fontWeight: 700 }}>修改不會影響已經記錄過的歷史餐點</div>}
          {!editingId && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={() => setFormMode('manual')} style={{ flex: 1, border: 'none', background: formMode === 'manual' ? 'var(--primary)' : 'var(--sunken)', color: formMode === 'manual' ? '#fff' : 'var(--text-muted)', fontWeight: 800, fontSize: 13, padding: '10px 12px', borderRadius: 14, cursor: 'pointer' }}>手動輸入</button>
              <button onClick={() => setFormMode('json')} style={{ flex: 1, border: 'none', background: formMode === 'json' ? 'var(--primary)' : 'var(--sunken)', color: formMode === 'json' ? '#fff' : 'var(--text-muted)', fontWeight: 800, fontSize: 13, padding: '10px 12px', borderRadius: 14, cursor: 'pointer' }}>JSON 輸入</button>
            </div>
          )}

          {formMode === 'manual' && (
            <>
              <div style={{ marginTop: 10, background: 'var(--sunken)', borderRadius: 14, padding: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="sparkles" size={14} />AI 搜尋（用一句話描述，自動帶入下面欄位）</div>
                <form onSubmit={(e) => { e.preventDefault(); aiSearch(); }} style={{ display: 'flex', gap: 8 }}>
                  <input aria-label="AI 搜尋食物" type="search" enterKeyHint="search" value={aiQuery} onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="例如：7-11 御飯糰 鮭魚"
                    style={{ flex: 1, minWidth: 0, border: 'none', background: 'var(--surface)', borderRadius: 12, padding: '12px 14px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }} />
                  <button type="submit" disabled={aiBusy || !aiQuery.trim()}
                    style={{ border: 'none', background: aiBusy ? 'var(--line-strong)' : 'var(--primary)', color: '#fff', fontWeight: 800, fontSize: 14, padding: '0 16px', borderRadius: 12, cursor: 'pointer', flexShrink: 0 }}>{aiBusy ? '查詢中…' : '搜尋'}</button>
                </form>
                {aiError && <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: 'var(--danger)' }}>{aiError}</div>}
              </div>

              <div style={{ marginTop: 14, fontSize: 13, fontWeight: 800, color: 'var(--text-muted)' }}>食物名稱</div>
              <input aria-label="食物名稱" type="text" value={form.name} onChange={setField('name')} placeholder="例如：媽媽的炒飯" style={{ width: '100%', marginTop: 5, border: 'none', background: 'var(--surface-alt)', borderRadius: 12, padding: '12px 14px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }} />
              <div style={{ marginTop: 12, fontSize: 13, fontWeight: 800, color: 'var(--text-muted)' }}>品牌（選填）</div>
              <input aria-label="品牌" type="text" value={form.brand} onChange={setField('brand')} placeholder="例如：7-11" style={{ width: '100%', marginTop: 5, border: 'none', background: 'var(--surface-alt)', borderRadius: 12, padding: '12px 14px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }} />
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted)' }}>份量</div><input aria-label="份量" type="text" value={form.unit} onChange={setField('unit')} placeholder="1 碗" style={{ width: '100%', marginTop: 5, border: 'none', background: 'var(--surface-alt)', borderRadius: 12, padding: 12, fontSize: 16, fontWeight: 700, color: 'var(--text)' }} /></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted)' }}>卡路里</div><input aria-label="卡路里" type="number" inputMode="numeric" value={form.cal} onChange={setField('cal')} placeholder="450" style={{ width: '100%', marginTop: 5, border: 'none', background: 'var(--surface-alt)', borderRadius: 12, padding: 12, fontSize: 16, fontWeight: 700, color: 'var(--text)' }} /></div>
              </div>
              <div style={{ marginTop: 14, fontSize: 13, fontWeight: 800, color: 'var(--text-muted)' }}>三大營養素 (g) · 可留空</div>
              <div style={{ marginTop: 5, display: 'flex', gap: 8 }}>
                {[{ key: 'p', label: '蛋白質', color: 'var(--primary)' }, { key: 'c', label: '碳水', color: '#E8A13C' }, { key: 'f', label: '脂肪', color: '#5FA8D3' }].map((m) => (
                  <div key={m.key} style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: m.color, marginBottom: 3 }}>{m.label}</div>
                    <input aria-label={m.label} type="number" inputMode="decimal" value={form[m.key]} onChange={setField(m.key)} placeholder="0" style={{ width: '100%', border: 'none', background: 'var(--surface-alt)', borderRadius: 12, padding: '12px 10px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, fontSize: 13, fontWeight: 800, color: 'var(--text-muted)' }}>備註（選填）</div>
              <textarea aria-label="備註" value={form.note} onChange={setField('note')} placeholder="例如：去冰半糖、不要香菜" rows={2}
                style={{ width: '100%', marginTop: 5, border: 'none', background: 'var(--surface-alt)', borderRadius: 12, padding: '12px 14px', fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'inherit', resize: 'none' }} />
            </>
          )}

          {!editingId && formMode === 'json' && (
            <>
              <div style={{ marginTop: 10, background: 'var(--surface-alt)', borderRadius: 14, padding: '10px 12px' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4 }}>支援格式</div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)', fontWeight: 700, lineHeight: 1.6, fontFamily: 'monospace' }}>[{`{"name":"雞腿便當","unit":"1 份","cal":680,"p":35,"c":70,"f":22,"brand":"7-11","note":"去冰半糖"}`}]</div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)', fontWeight: 600, marginTop: 4 }}>unit / serving / brand / note 選填</div>
              </div>
              <textarea aria-label="貼上 JSON" value={jsonText} onChange={(e) => { setJsonText(e.target.value); setJsonError(''); setJsonSuccess(0); }} placeholder="貼上 JSON…"
                style={{ width: '100%', minHeight: 180, marginTop: 12, border: 'none', background: 'var(--surface-alt)', borderRadius: 16, padding: '12px 14px', fontSize: 16, fontWeight: 600, color: 'var(--text)', fontFamily: 'monospace', resize: 'none', lineHeight: 1.6 }} />
              {jsonError && <div style={{ marginTop: 10, background: 'var(--danger-bg)', borderRadius: 12, padding: '10px 12px', fontSize: 13, fontWeight: 700, color: 'var(--danger)' }}>{jsonError}</div>}
              {jsonSuccess > 0 && <div style={{ marginTop: 10, background: 'var(--success-bg)', borderRadius: 12, padding: '10px 12px', fontSize: 13, fontWeight: 800, color: 'var(--success)' }}>成功匯入並加入 {jsonSuccess} 筆食物到{mealLabel}</div>}
              <button onClick={importJsonFoods} style={{ width: '100%', marginTop: 12, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 900, fontSize: 14, padding: 14, borderRadius: 16, cursor: 'pointer' }}>匯入到食物庫並加入{mealLabel}</button>
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}
