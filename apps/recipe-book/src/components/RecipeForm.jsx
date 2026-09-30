// 新增 / 編輯食譜的表單。recipe = null 為新增模式。
import React, { useState } from 'react';
import { parseIngredients, parseNotes, parseSteps, parseYieldInfo } from '../utils.js';
import Icon from '@peggy-life/shared/Icon.jsx';
import { UI } from '@peggy-life/shared/ui';

// 可編輯清單（步驟／心得／製作參數共用）。
// value 可以是字串（steps/notes）或物件（parameters），用 set() 換整筆、用 patch() 改物件的部分欄位。
// minOne=true（步驟/心得）：刪到只剩最後一行時自動補一個空行，UI 不會整段消失。
// minOne=false（製作參數，選填欄位）：允許完全空白，跟原本「新食譜預設 0 行」的行為一致。
function useEditableList(initialItems, makeEmpty, { minOne = true } = {}) {
  const [items, setItems] = useState(() => (initialItems.length > 0 || !minOne ? initialItems : [makeEmpty()]));
  const set = (idx, value) => setItems((prev) => prev.map((it, i) => (i === idx ? value : it)));
  const patch = (idx, patchObj) => setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patchObj } : it)));
  const add = () => setItems((prev) => [...prev, makeEmpty()]);
  const remove = (idx) => setItems((prev) => {
    const next = prev.filter((_, i) => i !== idx);
    return next.length > 0 || !minOne ? next : [makeEmpty()];
  });
  const reset = (newItems) => setItems(newItems.length > 0 || !minOne ? newItems : [makeEmpty()]);
  return { items, set, patch, add, remove, reset };
}

const S = {
  view: { paddingBottom: 32 },
  card: { ...UI.card, margin: '8px 20px 0', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 },
  label: { ...UI.fieldLabel },
  hint: { fontSize: 13, color: 'var(--text-muted)', marginTop: 6 },
  field: { display: 'flex', flexDirection: 'column' },
  sectionBox: { background: 'var(--sunken)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 },
  itemRow: { display: 'grid', gap: 6, gridTemplateColumns: 'minmax(0, 1fr) 104px 32px', alignItems: 'center' },
  itemRow2: { display: 'grid', gap: 6, gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center' },
  kvRow: { display: 'grid', gap: 6, gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) 32px', alignItems: 'center', marginBottom: 6 },
  listRow: { display: 'grid', gap: 8, gridTemplateColumns: '24px minmax(0, 1fr) 32px', alignItems: 'start', marginBottom: 6 },
  smallInput: { ...UI.input, minHeight: 40, fontSize: 14 },
  smallTextarea: { ...UI.textarea, minHeight: 40, fontSize: 14, lineHeight: 1.5, padding: '9px 12px' },
  rowBtn: { width: 32, height: 32, padding: 0, border: 'none', borderRadius: 999, background: 'none', color: 'var(--text-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  addBtn: { ...UI.btnText, alignSelf: 'flex-start', minHeight: 36, padding: '0 4px' },
  stepNo: { width: 24, height: 24, marginTop: 8, borderRadius: 999, background: 'var(--primary-soft)', color: 'var(--primary-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 },
  noteDot: { width: 5, height: 5, margin: '18px auto 0', borderRadius: 3, background: 'var(--primary-ink)' },
  baseLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' },
  shareRow: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: 'var(--text)', cursor: 'pointer' },
  actions: { display: 'flex', gap: 8, margin: '20px 20px 0' },
  deleteWrap: { display: 'flex', justifyContent: 'center', margin: '16px 20px 0' },
};

function emptyItem(isBase = false) {
  return { name: '', amount: '', brand: '', is_base: isBase };
}

function emptySection(isBase = false) {
  return { type: '', items: [emptyItem(isBase)] };
}

// flat ingredients → grouped sections（用 type 分組，沒 type 的併在第一區）
function groupIngredientsToSections(ingredients) {
  if (!ingredients?.length) return [emptySection(true)];
  const byType = new Map();
  ingredients.forEach((ing) => {
    const t = ing.type || '';
    if (!byType.has(t)) byType.set(t, []);
    byType.get(t).push({
      name: ing.name || '',
      amount: ing.amount || '',
      brand: ing.brand || '',
      is_base: !!ing.is_base,
    });
  });
  return Array.from(byType.entries()).map(([type, items]) => ({ type, items }));
}

function flattenSections(sections) {
  const out = [];
  sections.forEach((sec) => {
    sec.items.forEach((it) => {
      if (!it.name.trim() && !it.amount.trim()) return;
      out.push({
        name: it.name.trim(),
        amount: it.amount.trim(),
        brand: it.brand?.trim() || '',
        type: sec.type?.trim() || '',
        is_base: !!it.is_base,
      });
    });
  });
  return out;
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
  const [ingredientSections, setIngredientSections] = useState(() => {
    return groupIngredientsToSections(parseIngredients(recipe?.ingredients));
  });
  const stepsList = useEditableList(
    parseSteps(recipe?.steps).map((s) => s.text),
    () => '',
  );
  const notesList = useEditableList(parseNotes(recipe?.notes), () => '');
  const paramsList = useEditableList(paramsToList(recipe?.parameters), emptyParameter, { minOne: false });
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
      setIngredientSections(groupIngredientsToSections(parseIngredients(parsed.ingredients)));
    }
    if (parsed.steps !== undefined) {
      stepsList.reset(parseSteps(parsed.steps).map((s) => s.text));
    }
    if (parsed.notes !== undefined) {
      notesList.reset(parseNotes(parsed.notes));
    }
    if (parsed.parameters && typeof parsed.parameters === 'object') {
      paramsList.reset(paramsToList(parsed.parameters));
    }
    setImportOpen(false);
    setImportText('');
  };

  const updateSectionType = (secIdx, type) => {
    setIngredientSections((prev) => prev.map((s, i) => (i === secIdx ? { ...s, type } : s)));
  };
  const addSection = () => {
    setIngredientSections((prev) => [...prev, { type: '', items: [emptyItem(false)] }]);
  };
  const removeSection = (secIdx) => {
    setIngredientSections((prev) => {
      const next = prev.filter((_, i) => i !== secIdx);
      return next.length > 0 ? next : [emptySection(true)];
    });
  };
  const updateItem = (secIdx, itemIdx, patch) => {
    setIngredientSections((prev) => prev.map((s, i) => i !== secIdx ? s : {
      ...s,
      items: s.items.map((it, j) => (j === itemIdx ? { ...it, ...patch } : it)),
    }));
  };
  const addItem = (secIdx) => {
    setIngredientSections((prev) => prev.map((s, i) => i !== secIdx ? s : {
      ...s,
      items: [...s.items, emptyItem(false)],
    }));
  };
  const removeItem = (secIdx, itemIdx) => {
    setIngredientSections((prev) => prev.map((s, i) => i !== secIdx ? s : {
      ...s,
      items: s.items.filter((_, j) => j !== itemIdx).length > 0
        ? s.items.filter((_, j) => j !== itemIdx)
        : [emptyItem(false)],
    }));
  };
  // 是主食材：全域唯一，按下會清掉所有區的 is_base 再設這一個
  const setBaseItem = (secIdx, itemIdx) => {
    setIngredientSections((prev) => prev.map((s, i) => ({
      ...s,
      items: s.items.map((it, j) => ({ ...it, is_base: i === secIdx && j === itemIdx })),
    })));
  };

  const handleSave = async () => {
    setError('');
    if (!title.trim()) { setError('請輸入食譜名稱'); return; }

    const categoryArr = categoryText.split(/[,、，]/).map((s) => s.trim()).filter(Boolean);
    const yieldArr = yieldText.split(/[,、，]/).map((s) => s.trim()).filter(Boolean);
    const cleanIngredients = flattenSections(ingredientSections);
    const stepsArr = stepsList.items.map((s) => s.trim()).filter(Boolean)
      .map((text, idx) => ({ text, type: '', sort: idx + 1 }));
    const notesArr = notesList.items.map((n) => n.trim()).filter(Boolean);
    const paramsObj = {};
    paramsList.items.forEach(({ key, value }) => {
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
      notes: notesArr,
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
      <header style={UI.subBar}>
        <button type="button" aria-label="取消" onClick={onCancel} disabled={busy} style={UI.iconBtn}><Icon name="chevron-left" size={20} /></button>
        <h1 style={UI.subTitle}>{isEdit ? '編輯食譜' : '新增食譜'}</h1>
      </header>

      <div style={S.card}>
        <div>
          <button
            type="button"
            onClick={() => { setImportOpen((v) => !v); setImportError(''); }}
            style={{ ...UI.btnNeutral, width: '100%' }}
          >
            {importOpen ? <><Icon name="x" size={16} />關閉 JSON 匯入</> : <><Icon name="download" size={16} />用 JSON 匯入（之後仍可編輯）</>}
          </button>
          {importOpen && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea aria-label="貼上食譜 JSON"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                style={{ ...UI.textarea, minHeight: 140, fontFamily: 'monospace', fontSize: 12 }}
                placeholder={'貼上食譜 JSON，例如：\n{\n  "title": "番茄炒蛋",\n  "category": ["家常菜"],\n  "ingredients": [\n    { "name": "蛋", "amount": "3 顆", "is_base": true },\n    { "name": "番茄", "amount": "200 g" }\n  ],\n  "steps": ["蛋打散加鹽", "番茄切塊下鍋"],\n  "notes": ["小火慢炒"],\n  "parameters": { "火力": "中小火" }\n}'}
              />
              {importError && <div style={UI.note('danger')}>{importError}</div>}
              <button type="button" onClick={applyImport} style={{ ...UI.btnSecondary, width: '100%' }}>
                解析並套用到下面的表單
              </button>
              <div style={{ ...S.hint, marginTop: 0 }}>套用後欄位會被填上，你可以在下面繼續編輯，按「建立食譜」才會送出。</div>
            </div>
          )}
        </div>

        <label style={S.field}><span style={S.label}>食譜名稱 *</span>
          <input aria-label="食譜名稱" style={UI.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例：番茄炒蛋" />
        </label>

        <label style={S.field}><span style={S.label}>分類標籤</span>
          <input aria-label="分類標籤" style={UI.input} value={categoryText} onChange={(e) => setCategoryText(e.target.value)} placeholder="例：家常菜、快手、便當" />
          <span style={S.hint}>用逗號或頓號分隔多個標籤</span>
        </label>

        <label style={S.field}><span style={S.label}>食譜圖片 URL（選填）</span>
          <input aria-label="食譜圖片 URL" style={UI.input} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
        </label>

        <label style={S.field}><span style={S.label}>份量 / 產出（選填）</span>
          <input aria-label="份量 / 產出" style={UI.input} value={yieldText} onChange={(e) => setYieldText(e.target.value)} placeholder="例：2 人份、約 6 塊" />
          <span style={S.hint}>用逗號或頓號分隔多筆</span>
        </label>

        <div style={S.field}>
          <span style={S.label}>食材</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ingredientSections.map((section, secIdx) => (
              <div key={secIdx} style={S.sectionBox}>
                <div style={{ display: 'grid', gap: 6, gridTemplateColumns: 'minmax(0, 1fr) 32px', alignItems: 'center' }}>
                  <input aria-label="分區名稱"
                    style={{ ...S.smallInput, fontWeight: 500 }}
                    value={section.type}
                    onChange={(e) => updateSectionType(secIdx, e.target.value)}
                    placeholder="分區名稱（留空＝未分類，例：主料、醬料）"
                  />
                  <button type="button" className="tap" style={S.rowBtn} onClick={() => removeSection(secIdx)} aria-label="刪除分區" title="刪除整個分區"><Icon name="x" size={16} /></button>
                </div>

                {section.items.map((it, itemIdx) => (
                  <div key={itemIdx} style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: itemIdx > 0 ? 8 : 0, borderTop: itemIdx > 0 ? '1px solid var(--line)' : 'none' }}>
                    <div style={S.itemRow}>
                      <input aria-label="食材名稱" style={S.smallInput} value={it.name} onChange={(e) => updateItem(secIdx, itemIdx, { name: e.target.value })} placeholder="食材名稱（如：雞肉）" />
                      <input aria-label="食材份量" style={S.smallInput} value={it.amount} onChange={(e) => updateItem(secIdx, itemIdx, { amount: e.target.value })} placeholder="份量（200g）" />
                      <button type="button" className="tap" style={S.rowBtn} onClick={() => removeItem(secIdx, itemIdx)} aria-label="刪除食材"><Icon name="x" size={16} /></button>
                    </div>
                    <div style={S.itemRow2}>
                      <input aria-label="品牌或備註" style={S.smallInput} value={it.brand || ''} onChange={(e) => updateItem(secIdx, itemIdx, { brand: e.target.value })} placeholder="品牌/備註（選填，如：日式）" />
                      <label style={S.baseLabel}>
                        <input type="radio" checked={!!it.is_base} onChange={() => setBaseItem(secIdx, itemIdx)} style={{ accentColor: 'var(--primary)' }} /> 主食材
                      </label>
                    </div>
                  </div>
                ))}

                <button type="button" style={S.addBtn} onClick={() => addItem(secIdx)}><Icon name="plus" size={16} />新增食材到「{section.type || '未分類'}」</button>
              </div>
            ))}
            <button type="button" style={{ ...UI.btnSecondary, alignSelf: 'flex-start' }} onClick={addSection}><Icon name="plus" size={16} />新增食材分區</button>
          </div>
        </div>

        <div style={S.field}>
          <span style={S.label}>步驟</span>
          {stepsList.items.map((text, idx) => (
            <div key={idx} style={S.listRow}>
              <span style={S.stepNo}>{idx + 1}</span>
              <textarea aria-label={`步驟 ${idx + 1}`}
                value={text}
                onChange={(e) => stepsList.set(idx, e.target.value)}
                placeholder={`步驟 ${idx + 1}`}
                rows={2}
                style={S.smallTextarea}
              />
              <button type="button" className="tap" style={{ ...S.rowBtn, marginTop: 4 }} onClick={() => stepsList.remove(idx)} aria-label="刪除步驟"><Icon name="x" size={16} /></button>
            </div>
          ))}
          <button type="button" style={S.addBtn} onClick={stepsList.add}><Icon name="plus" size={16} />新增一個步驟</button>
        </div>

        <div style={S.field}>
          <span style={S.label}>心得備註（選填）</span>
          {notesList.items.map((text, idx) => (
            <div key={idx} style={S.listRow}>
              <span aria-hidden="true" style={S.noteDot} />
              <textarea aria-label="備註"
                value={text}
                onChange={(e) => notesList.set(idx, e.target.value)}
                placeholder="一條備註（例：小火慢炒避免焦黑）"
                rows={2}
                style={S.smallTextarea}
              />
              <button type="button" className="tap" style={{ ...S.rowBtn, marginTop: 4 }} onClick={() => notesList.remove(idx)} aria-label="刪除備註"><Icon name="x" size={16} /></button>
            </div>
          ))}
          <button type="button" style={S.addBtn} onClick={notesList.add}><Icon name="plus" size={16} />新增一條備註</button>
        </div>

        <div style={S.field}>
          <span style={S.label}>製作參數（選填）</span>
          {paramsList.items.map((row, idx) => (
            <div key={idx} style={S.kvRow}>
              <input aria-label="參數名稱" style={S.smallInput} value={row.key} onChange={(e) => paramsList.patch(idx, { key: e.target.value })} placeholder="名稱（例：烤箱溫度）" />
              <input aria-label="參數值" style={S.smallInput} value={row.value} onChange={(e) => paramsList.patch(idx, { value: e.target.value })} placeholder="值（例：180°C）" />
              <button type="button" className="tap" style={S.rowBtn} onClick={() => paramsList.remove(idx)} aria-label="刪除參數"><Icon name="x" size={16} /></button>
            </div>
          ))}
          <button type="button" style={S.addBtn} onClick={paramsList.add}><Icon name="plus" size={16} />新增一筆參數</button>
        </div>

        <label style={S.shareRow}>
          <input type="checkbox" checked={isShared} onChange={(e) => setIsShared(e.target.checked)} style={{ width: 20, height: 20, accentColor: 'var(--primary)' }} />
          <Icon name="globe" size={18} style={{ color: 'var(--text-muted)' }} />分享給其他人（取消勾選則只有自己看得到）
        </label>

        {error && <div style={UI.note('danger')}>{error}</div>}
      </div>

      <div style={S.actions}>
        <button type="button" style={{ ...UI.btnPrimary, flex: 1, opacity: busy ? 0.6 : 1 }} onClick={handleSave} disabled={busy}>
          {busy ? '儲存中…' : (isEdit ? '儲存變更' : '建立食譜')}
        </button>
        <button type="button" style={{ ...UI.btnNeutral, minHeight: 48 }} onClick={onCancel} disabled={busy}>取消</button>
      </div>

      {isEdit && onDelete && (
        <div style={S.deleteWrap}>
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            style={confirmDelete ? { ...UI.btnNeutral, background: 'var(--danger-bg)', color: 'var(--danger-ink)' } : UI.btnDangerText}
          >
            {confirmDelete ? '確認刪除（無法復原，再按一次）' : <><Icon name="trash" size={16} />刪除這個食譜</>}
          </button>
        </div>
      )}
    </div>
  );
}
