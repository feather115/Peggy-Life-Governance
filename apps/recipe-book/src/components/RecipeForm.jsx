// 新增 / 編輯食譜的表單。recipe = null 為新增模式。
import React, { useState } from 'react';
import { parseIngredients, parseNotes, parseSteps, parseYieldInfo } from '../utils.js';

const S = {
  view: { padding: '6px 18px 24px' },
  title: { fontSize: 22, fontWeight: 900, color: '#3D281E', margin: 0 },
  label: { display: 'block', fontSize: 13, fontWeight: 900, color: '#3D281E', marginBottom: 6, marginTop: 14 },
  hint: { fontSize: 11, color: '#8E7568', fontWeight: 700, marginTop: 4 },
  input: { width: '100%', boxSizing: 'border-box', border: 'none', background: '#FDF7F4', borderRadius: 14, padding: '11px 14px', fontSize: 14, fontWeight: 700, color: '#3D281E', outline: 'none' },
  textarea: { width: '100%', boxSizing: 'border-box', border: 'none', background: '#FDF7F4', borderRadius: 14, padding: '11px 14px', fontSize: 14, fontWeight: 700, color: '#3D281E', outline: 'none', minHeight: 100, lineHeight: 1.6, fontFamily: 'inherit' },
  row: { display: 'grid', gap: 6, gridTemplateColumns: '1fr 110px 28px', marginBottom: 6, alignItems: 'center' },
  kvRow: { display: 'grid', gap: 6, gridTemplateColumns: '1fr 1fr 28px', marginBottom: 6 },
  smallInput: { boxSizing: 'border-box', border: 'none', background: '#FDF7F4', borderRadius: 12, padding: '9px 12px', fontSize: 13, fontWeight: 700, color: '#3D281E', outline: 'none' },
  rowBtn: { border: 'none', background: '#FDF7F4', color: '#C5B4AC', borderRadius: 12, width: 28, height: 30, fontSize: 16, fontWeight: 900, cursor: 'pointer', padding: 0 },
  addBtn: { border: '1px dashed #E87A24', background: 'transparent', color: '#E87A24', borderRadius: 12, padding: '8px 12px', fontSize: 12, fontWeight: 900, cursor: 'pointer', marginTop: 4 },
  baseLabel: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#8E7568', fontWeight: 800, marginTop: 6 },
  actions: { display: 'flex', gap: 10, marginTop: 24 },
  saveBtn: { flex: 1, border: 'none', background: '#E87A24', color: '#fff', borderRadius: 14, padding: '12px 14px', fontSize: 15, fontWeight: 900, cursor: 'pointer' },
  cancelBtn: { border: 'none', background: '#F0E7E1', color: '#8E7568', borderRadius: 14, padding: '12px 18px', fontSize: 15, fontWeight: 900, cursor: 'pointer' },
  errorBox: { background: '#FEE2E2', color: '#B91C1C', padding: '10px 12px', borderRadius: 12, fontSize: 13, fontWeight: 800, marginTop: 12 },
};

function emptyIngredient(isBase = false) {
  return { name: '', amount: '', brand: '', type: '', is_base: isBase };
}

function emptyParameter() {
  return { key: '', value: '' };
}

function paramsToList(params) {
  if (!params || typeof params !== 'object') return [];
  return Object.entries(params).map(([key, value]) => ({ key, value: String(value ?? '') }));
}

export default function RecipeForm({ recipe, onSave, onCancel, onDelete }) {
  const isEdit = !!recipe;

  const [title, setTitle] = useState(recipe?.title || '');
  const [imageUrl, setImageUrl] = useState(recipe?.image_url || '');
  const [categoryText, setCategoryText] = useState((recipe?.category || []).join('、'));
  const [yieldText, setYieldText] = useState((parseYieldInfo(recipe?.yield_info) || []).join('、'));
  const [ingredients, setIngredients] = useState(() => {
    const existing = parseIngredients(recipe?.ingredients);
    return existing.length > 0 ? existing : [emptyIngredient(true)];
  });
  const [stepsText, setStepsText] = useState(() => {
    const parsed = parseSteps(recipe?.steps);
    return parsed.map((s) => s.text).join('\n');
  });
  const [notesText, setNotesText] = useState(() => parseNotes(recipe?.notes).join('\n'));
  const [parameters, setParameters] = useState(() => {
    const existing = paramsToList(recipe?.parameters);
    return existing.length > 0 ? existing : [];
  });
  const [isShared, setIsShared] = useState(!!recipe?.is_shared);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  const applyImport = () => {
    setImportError('');
    let parsed;
    try {
      parsed = JSON.parse(importText);
    } catch (e) {
      setImportError('JSON 格式錯誤：' + e.message);
      return;
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      setImportError('需要是物件 {} 格式');
      return;
    }
    if (typeof parsed.title === 'string') setTitle(parsed.title);
    if (typeof parsed.image_url === 'string') setImageUrl(parsed.image_url);
    if (Array.isArray(parsed.category)) setCategoryText(parsed.category.join('、'));
    else if (typeof parsed.category === 'string') setCategoryText(parsed.category);
    if (Array.isArray(parsed.yield_info)) setYieldText(parsed.yield_info.join('、'));
    else if (typeof parsed.yield_info === 'string') setYieldText(parsed.yield_info);
    if (parsed.ingredients !== undefined) {
      const ing = parseIngredients(parsed.ingredients);
      setIngredients(ing.length > 0 ? ing : [emptyIngredient(true)]);
    }
    if (parsed.steps !== undefined) {
      const st = parseSteps(parsed.steps);
      setStepsText(st.map((s) => s.text).join('\n'));
    }
    if (parsed.notes !== undefined) {
      setNotesText(parseNotes(parsed.notes).join('\n'));
    }
    if (parsed.parameters && typeof parsed.parameters === 'object') {
      setParameters(paramsToList(parsed.parameters));
    }
    setImportOpen(false);
    setImportText('');
  };

  const updateIngredient = (idx, patch) => {
    setIngredients((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };
  const setBaseIngredient = (idx) => {
    setIngredients((prev) => prev.map((row, i) => ({ ...row, is_base: i === idx })));
  };
  const removeIngredient = (idx) => {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  };
  const addIngredient = () => {
    setIngredients((prev) => [...prev, emptyIngredient(prev.length === 0)]);
  };

  const updateParam = (idx, patch) => {
    setParameters((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };
  const removeParam = (idx) => {
    setParameters((prev) => prev.filter((_, i) => i !== idx));
  };
  const addParam = () => setParameters((prev) => [...prev, emptyParameter()]);

  const handleSave = async () => {
    setError('');
    if (!title.trim()) { setError('請輸入食譜名稱'); return; }

    const categoryArr = categoryText.split(/[,、，]/).map((s) => s.trim()).filter(Boolean);
    const yieldArr = yieldText.split(/[,、，]/).map((s) => s.trim()).filter(Boolean);
    const cleanIngredients = ingredients
      .filter((row) => row.name.trim() || row.amount.trim())
      .map((row) => ({
        name: row.name.trim(),
        amount: row.amount.trim(),
        brand: row.brand?.trim() || '',
        type: row.type?.trim() || '',
        is_base: !!row.is_base,
      }));
    const stepsArr = stepsText.split('\n').map((s) => s.trim()).filter(Boolean)
      .map((text, idx) => ({ text, type: '', sort: idx + 1 }));
    const notesArr = notesText.split('\n').map((s) => s.trim()).filter(Boolean);
    const paramsObj = {};
    parameters.forEach(({ key, value }) => {
      const k = key.trim();
      if (k) paramsObj[k] = value;
    });

    const payload = {
      title: title.trim(),
      image_url: imageUrl.trim() || null,
      category: categoryArr,
      yield_info: yieldArr,
      ingredients: cleanIngredients,
      steps: stepsArr,
      notes: notesArr.length > 0 ? notesArr.join('\n') : null,
      parameters: paramsObj,
      is_shared: isShared,
    };

    setBusy(true);
    try {
      await onSave(payload, recipe?.id);
    } catch (e) {
      setError(e.message || '儲存失敗');
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setBusy(true);
    try {
      await onDelete(recipe.id);
    } catch (e) {
      setError(e.message || '刪除失敗');
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div style={S.view}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button type="button" onClick={onCancel} disabled={busy} style={{ border: 'none', background: '#fff', color: '#E87A24', fontWeight: 900, fontSize: 14, padding: '8px 16px', borderRadius: 14, cursor: 'pointer', boxShadow: '0 4px 12px -8px rgba(0,0,0,.2)' }}>
          ‹ 取消
        </button>
        <h1 style={S.title}>{isEdit ? '編輯食譜' : '新增食譜'}</h1>
        <div style={{ width: 64 }} />
      </header>

      <div style={{ background: '#fff', borderRadius: 20, padding: 18, boxShadow: '0 10px 24px -18px rgba(232,122,36,.3)' }}>
        <div style={{ marginBottom: 4 }}>
          <button
            type="button"
            onClick={() => { setImportOpen((v) => !v); setImportError(''); }}
            style={{ border: '1px dashed #8E7568', background: 'transparent', color: '#8E7568', padding: '8px 14px', borderRadius: 12, fontSize: 12, fontWeight: 900, cursor: 'pointer', width: '100%' }}
          >
            {importOpen ? '× 關閉 JSON 匯入' : '📥 用 JSON 匯入（之後仍可編輯）'}
          </button>
          {importOpen && (
            <div style={{ marginTop: 8 }}>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                style={{ ...S.textarea, minHeight: 140, fontFamily: 'monospace', fontSize: 12 }}
                placeholder={'貼上食譜 JSON，例如：\n{\n  "title": "番茄炒蛋",\n  "category": ["家常菜"],\n  "ingredients": [\n    { "name": "蛋", "amount": "3 顆", "is_base": true },\n    { "name": "番茄", "amount": "200 g" }\n  ],\n  "steps": ["蛋打散加鹽", "番茄切塊下鍋"],\n  "notes": ["小火慢炒"],\n  "parameters": { "火力": "中小火" }\n}'}
              />
              {importError && <div style={{ ...S.errorBox, marginTop: 8 }}>{importError}</div>}
              <button type="button" onClick={applyImport} style={{ ...S.addBtn, width: '100%', marginTop: 8, borderStyle: 'solid', background: '#FFF3EB' }}>
                解析並套用到下面的表單
              </button>
              <div style={{ ...S.hint, marginTop: 4 }}>套用後欄位會被填上，你可以在下面繼續編輯，按「建立食譜」才會送出。</div>
            </div>
          )}
        </div>

        <label style={{ ...S.label, marginTop: 14 }}>食譜名稱 *</label>
        <input style={S.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例：番茄炒蛋" />

        <label style={S.label}>分類標籤</label>
        <input style={S.input} value={categoryText} onChange={(e) => setCategoryText(e.target.value)} placeholder="例：家常菜、快手、便當" />
        <div style={S.hint}>用逗號或頓號分隔多個標籤</div>

        <label style={S.label}>食譜圖片 URL（選填）</label>
        <input style={S.input} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />

        <label style={S.label}>份量 / 產出（選填）</label>
        <input style={S.input} value={yieldText} onChange={(e) => setYieldText(e.target.value)} placeholder="例：2 人份、約 6 塊" />
        <div style={S.hint}>用逗號或頓號分隔多筆</div>

        <label style={S.label}>食材</label>
        {ingredients.map((row, idx) => (
          <React.Fragment key={idx}>
            <div style={S.row}>
              <input style={S.smallInput} value={row.name} onChange={(e) => updateIngredient(idx, { name: e.target.value })} placeholder="名稱" />
              <input style={S.smallInput} value={row.amount} onChange={(e) => updateIngredient(idx, { amount: e.target.value })} placeholder="份量 (200g)" />
              <button type="button" style={S.rowBtn} onClick={() => removeIngredient(idx)} aria-label="刪除食材">×</button>
            </div>
            <label style={S.baseLabel}>
              <input type="radio" checked={!!row.is_base} onChange={() => setBaseIngredient(idx)} /> 設為主食材（用來縮放配方）
            </label>
          </React.Fragment>
        ))}
        <button type="button" style={S.addBtn} onClick={addIngredient}>+ 新增一行食材</button>

        <label style={S.label}>步驟</label>
        <textarea style={S.textarea} value={stepsText} onChange={(e) => setStepsText(e.target.value)} placeholder={'一行一個步驟\n例如：\n蛋打散加少許鹽\n番茄切塊下鍋'} />

        <label style={S.label}>心得備註（選填）</label>
        <textarea style={S.textarea} value={notesText} onChange={(e) => setNotesText(e.target.value)} placeholder="一行一條備註" />

        <label style={S.label}>製作參數（選填）</label>
        {parameters.map((row, idx) => (
          <div key={idx} style={S.kvRow}>
            <input style={S.smallInput} value={row.key} onChange={(e) => updateParam(idx, { key: e.target.value })} placeholder="名稱（例：烤箱溫度）" />
            <input style={S.smallInput} value={row.value} onChange={(e) => updateParam(idx, { value: e.target.value })} placeholder="值（例：180°C）" />
            <button type="button" style={S.rowBtn} onClick={() => removeParam(idx)} aria-label="刪除參數">×</button>
          </div>
        ))}
        <button type="button" style={S.addBtn} onClick={addParam}>+ 新增一筆參數</button>

        <label style={{ ...S.label, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={isShared} onChange={(e) => setIsShared(e.target.checked)} />
          🌐 分享給其他人（取消勾選則只有自己看得到）
        </label>

        {error && <div style={S.errorBox}>{error}</div>}

        <div style={S.actions}>
          <button type="button" style={S.saveBtn} onClick={handleSave} disabled={busy}>
            {busy ? '儲存中…' : (isEdit ? '儲存變更' : '建立食譜')}
          </button>
          <button type="button" style={S.cancelBtn} onClick={onCancel} disabled={busy}>取消</button>
        </div>

        {isEdit && onDelete && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #F3DFD4' }}>
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              style={{ width: '100%', border: 'none', background: confirmDelete ? '#FEE2E2' : '#FDF7F4', color: confirmDelete ? '#B91C1C' : '#8E7568', borderRadius: 14, padding: '12px 14px', fontSize: 13, fontWeight: 900, cursor: 'pointer' }}
            >
              {confirmDelete ? '⚠️ 確認刪除（無法復原，再按一次）' : '🗑️ 刪除這個食譜'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
