// Food library bottom sheet: select built-in/custom food to add to meal, or switch to the form to add new custom foods.
import React, { useState } from 'react';
import { FOODS, MEALS_DEF } from '../constants.js';
import Sheet, { SheetHeader } from './Sheet.jsx';
import Icon from '@peggy-life/shared/Icon.jsx';
import { UI } from '@peggy-life/shared/ui';
import { confirmDialog, toast } from '@peggy-life/shared/feedback.jsx';

const MACROS = [
  { key: 'p', label: '蛋白質', color: 'var(--primary-ink)' },
  { key: 'c', label: '碳水', color: 'var(--carb)' },
  { key: 'f', label: '脂肪', color: 'var(--fat)' },
];

const S = {
  body: { flex: 1, overflowY: 'auto', padding: '4px 20px 24px', display: 'flex', flexDirection: 'column' },
  searchIcon: { position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' },
  clearBtn: { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 24, height: 24, padding: 0, border: 'none', borderRadius: 999, background: 'var(--sunken)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  actions: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginTop: 12 },
  empty: { marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-faint)' },
  listLabel: { ...UI.groupLabel, padding: 0, margin: '20px 0 4px' },
  foodRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' },
  infoBtn: { ...UI.rowText, padding: 0, border: 'none', background: 'none', color: 'inherit', textAlign: 'left' },
  nameLine: { display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 },
  name: { ...UI.rowTitle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  qtyHint: { color: 'var(--primary-ink)', fontWeight: 500 },
  qtyBad: { color: 'var(--warning-ink)', fontWeight: 500 },
  note: { fontSize: 12, color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  back: { ...UI.btnText, alignSelf: 'flex-start', minHeight: 32, padding: 0, color: 'var(--text-muted)' },
  hint: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 },
  aiBox: { background: 'var(--sunken)', borderRadius: 14, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 },
  aiLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--primary-ink)' },
  cols: (n) => ({ display: 'grid', gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, gap: 8 }),
  macroLabel: { ...UI.fieldLabel, display: 'flex', alignItems: 'center', gap: 6 },
  dot: (color) => ({ width: 8, height: 8, borderRadius: 4, background: color, flex: 'none' }),
  formatBox: { background: 'var(--sunken)', borderRadius: 14, padding: '12px 14px' },
  mono: { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, fontFamily: 'monospace', wordBreak: 'break-all' },
};

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
  const showToast = (message, isError = false) => toast(message, { tone: isError ? 'error' : 'default' });

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

  // 刪除自訂食物（原本在清單列上的垃圾桶，改放進編輯表單）
  const deleteEditing = async () => {
    const fo = customFoods.find((f) => f.id === editingId);
    if (!fo) return;
    if (!(await confirmDialog({ title: `刪除自訂食物「${fo.name}」？`, message: '已經記錄過的餐點不受影響。', confirmText: '刪除', danger: true }))) return;
    try {
      await removeCustomFood(fo.id);
    } catch (e) {
      showToast(`刪除失敗：${e.message || '請稍後再試'}`, true);
      return;
    }
    setEditingId(null);
    setFormOpen(false);
  };

  const showSave = formOpen && (editingId || formMode === 'manual');
  const title = !formOpen ? `加入${mealLabel}` : editingId ? '編輯自訂食物' : '新增自訂食物';

  return (
    <Sheet label="食物庫" onBackdrop={onClose} height="min(80vh, 720px)" zIndex={10}>
      <SheetHeader title={title} onClose={onClose}>
        {showSave && (
          <button type="button" onClick={save} disabled={!canSave} style={{ ...UI.btnPrimary, minHeight: 40, padding: '0 16px', fontSize: 14, opacity: canSave ? 1 : 0.4 }}>{editingId ? '儲存' : '儲存並加入'}</button>
        )}
      </SheetHeader>

      {!formOpen && (
        <div className="ps" style={S.body}>
          <div style={{ position: 'relative' }}>
            <Icon name="search" size={18} style={S.searchIcon} />
            <input aria-label="搜尋食物" type="search" enterKeyHint="search" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="搜尋食物名稱、品牌、備註" style={{ ...UI.input, padding: '0 40px' }} />
            {search && (
              <button type="button" aria-label="清除搜尋" className="tap" onClick={() => setSearch('')} style={S.clearBtn}><Icon name="x" size={14} /></button>
            )}
          </div>
          <div style={S.actions}>
            <button type="button" onClick={() => openCreateForm('manual')} style={UI.btnSecondary}><Icon name="plus" size={16} />自訂食物</button>
            <button type="button" onClick={() => openCreateForm('json')} style={UI.btnSecondary}><Icon name="clipboard" size={16} />JSON 匯入</button>
          </div>
          {kw && list.length === 0 && (
            <div style={S.empty}>找不到「{search.trim()}」，可以用上面的按鈕新增</div>
          )}
          {list.length > 0 && <h3 style={S.listLabel}>{kw ? '搜尋結果' : '食物庫 · 最近用過的在前'}</h3>}
          <div>
            {list.map((fo, i) => {
              const qty = getQtyNum(fo.id);
              const badQty = isNaN(qty) || qty <= 0;
              const info = (
                <>
                  <span style={S.nameLine}>
                    <span style={S.name}>{fo.name}</span>
                    {fo.custom && <span style={UI.tag('neutral')}>自訂</span>}
                  </span>
                  <span style={{ ...UI.rowMeta, ...UI.num }}>
                    {fo.brand ? `${fo.brand} · ` : ''}{fo.unit} · {fo.cal} kcal
                    {!badQty && qty !== 1 && <span style={S.qtyHint}> → {Math.round(fo.cal * qty)} kcal</span>}
                    {badQty && <span style={S.qtyBad}> · 請輸入份數</span>}
                  </span>
                  {fo.note && <span style={S.note}>{fo.note}</span>}
                </>
              );
              return (
                <div key={fo.id} style={{ ...S.foodRow, borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}>
                  {fo.custom
                    ? <button type="button" aria-label={`編輯自訂食物：${fo.name}`} onClick={() => startEdit(fo)} style={S.infoBtn}>{info}</button>
                    : <span style={UI.rowText}>{info}</span>}
                  <span style={UI.stepper}>
                    <button type="button" aria-label="減少份數" onClick={() => nudgeQty(fo.id, -0.5)} style={UI.stepperBtn}><Icon name="minus" size={16} /></button>
                    <input aria-label={`${fo.name} 份數`} type="number" inputMode="decimal" step="0.1" min="0.1" value={getQtyRaw(fo.id)}
                      onChange={(e) => setQtyRaw(fo.id, e.target.value)}
                      onBlur={(e) => { if (e.target.value.trim() === '') return; const n = getQtyNum(fo.id); if (!isNaN(n)) setQtyRaw(fo.id, Math.max(0.1, round1(n))); }}
                      style={UI.stepperInput} />
                    <button type="button" aria-label="增加份數" onClick={() => nudgeQty(fo.id, 0.5)} style={UI.stepperBtn}><Icon name="plus" size={16} /></button>
                  </span>
                  <button type="button" aria-label={`加入 ${fo.name}`} onClick={() => pick(fo)} disabled={badQty} style={{ ...UI.iconBtnSoft, opacity: badQty ? 0.4 : 1 }}><Icon name="plus" size={18} strokeWidth={2} /></button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {formOpen && (
        <div className="ps" style={{ ...S.body, gap: 16 }}>
          <button type="button" onClick={() => { setFormOpen(false); setEditingId(null); }} style={S.back}><Icon name="chevron-left" size={16} />回到食物庫</button>
          {editingId && <div style={S.hint}>修改不會影響已經記錄過的歷史餐點</div>}
          {!editingId && (
            <div style={UI.segTrack}>
              <button type="button" aria-pressed={formMode === 'manual'} onClick={() => setFormMode('manual')} style={UI.seg(formMode === 'manual')}>手動輸入</button>
              <button type="button" aria-pressed={formMode === 'json'} onClick={() => setFormMode('json')} style={UI.seg(formMode === 'json')}>JSON 輸入</button>
            </div>
          )}

          {formMode === 'manual' && (
            <>
              <div style={S.aiBox}>
                <div style={S.aiLabel}><Icon name="sparkles" size={16} />AI 搜尋：用一句話描述，自動帶入下面欄位</div>
                <form onSubmit={(e) => { e.preventDefault(); aiSearch(); }} style={{ display: 'flex', gap: 8 }}>
                  <input aria-label="AI 搜尋食物" type="search" enterKeyHint="search" value={aiQuery} onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="例如：7-11 御飯糰 鮭魚" style={{ ...UI.input, flex: 1, minWidth: 0 }} />
                  <button type="submit" disabled={aiBusy || !aiQuery.trim()} style={{ ...UI.btnSecondary, minHeight: 44, opacity: aiBusy || !aiQuery.trim() ? 0.5 : 1 }}>{aiBusy ? '查詢中…' : '搜尋'}</button>
                </form>
                {aiError && <div style={UI.fieldError}>{aiError}</div>}
              </div>

              <label><span style={UI.fieldLabel}>食物名稱</span><input aria-label="食物名稱" type="text" value={form.name} onChange={setField('name')} placeholder="例如：媽媽的炒飯" style={UI.input} /></label>
              <label><span style={UI.fieldLabel}>品牌（選填）</span><input aria-label="品牌" type="text" value={form.brand} onChange={setField('brand')} placeholder="例如：7-11" style={UI.input} /></label>
              <div style={S.cols(2)}>
                <label><span style={UI.fieldLabel}>份量</span><input aria-label="份量" type="text" value={form.unit} onChange={setField('unit')} placeholder="1 碗" style={UI.input} /></label>
                <label><span style={UI.fieldLabel}>卡路里</span><input aria-label="卡路里" type="number" inputMode="numeric" value={form.cal} onChange={setField('cal')} placeholder="450" style={UI.input} /></label>
              </div>
              <div>
                <span style={UI.fieldLabel}>三大營養素 (g) · 可留空</span>
                <div style={S.cols(3)}>
                  {MACROS.map((m) => (
                    <label key={m.key}>
                      <span style={S.macroLabel}><span style={S.dot(m.color)} />{m.label}</span>
                      <input aria-label={m.label} type="number" inputMode="decimal" value={form[m.key]} onChange={setField(m.key)} placeholder="0" style={UI.input} />
                    </label>
                  ))}
                </div>
              </div>
              <label><span style={UI.fieldLabel}>備註（選填）</span><textarea aria-label="備註" value={form.note} onChange={setField('note')} placeholder="例如：去冰半糖、不要香菜" rows={2} style={{ ...UI.textarea, resize: 'none' }} /></label>
              {editingId && (
                <button type="button" onClick={deleteEditing} style={{ ...UI.btnDangerText, alignSelf: 'center' }}><Icon name="trash" size={16} />刪除這個自訂食物</button>
              )}
            </>
          )}

          {!editingId && formMode === 'json' && (
            <>
              <div style={S.formatBox}>
                <div style={UI.fieldLabel}>支援格式</div>
                <div style={S.mono}>[{`{"name":"雞腿便當","unit":"1 份","cal":680,"p":35,"c":70,"f":22,"brand":"7-11","note":"去冰半糖"}`}]</div>
                <div style={{ ...S.hint, marginTop: 6 }}>unit / serving / brand / note 選填</div>
              </div>
              <textarea aria-label="貼上 JSON" value={jsonText} onChange={(e) => { setJsonText(e.target.value); setJsonError(''); setJsonSuccess(0); }} placeholder="貼上 JSON…"
                style={{ ...UI.textarea, minHeight: 180, fontFamily: 'monospace', resize: 'none' }} />
              {jsonError && <div style={UI.note('danger')}>{jsonError}</div>}
              {jsonSuccess > 0 && <div style={UI.note('success')}>成功匯入並加入 {jsonSuccess} 筆食物到{mealLabel}</div>}
              <button type="button" onClick={importJsonFoods} style={{ ...UI.btnPrimary, width: '100%' }}>匯入到食物庫並加入{mealLabel}</button>
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}
