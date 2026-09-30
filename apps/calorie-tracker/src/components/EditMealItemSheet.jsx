// Edits an already added meal item: name/brand/unit/calories/nutrients
// Only updates this specific record; does not affect food library definitions or historical records of other days.
// onDelete 選填：今天頁把「刪除」放在這裡（餐點列不再放小 × 鈕），刪完由呼叫端給 5 秒「復原」
import React, { useState } from 'react';
import Sheet, { SheetHeader } from './Sheet.jsx';
import { alertError } from '../utils.js';
import Icon from '@peggy-life/shared/Icon.jsx';
import { UI } from '@peggy-life/shared/ui';

const MACROS = [
  { key: 'p', label: '蛋白質', color: 'var(--primary-ink)' },
  { key: 'c', label: '碳水', color: 'var(--carb)' },
  { key: 'f', label: '脂肪', color: 'var(--fat)' },
];

const S = {
  body: { flex: 1, overflowY: 'auto', padding: '4px 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 },
  hint: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 },
  cols: (n) => ({ display: 'grid', gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, gap: 8 }),
  macroLabel: { ...UI.fieldLabel, display: 'flex', alignItems: 'center', gap: 6 },
  dot: (color) => ({ width: 8, height: 8, borderRadius: 4, background: color, flex: 'none' }),
};

export default function EditMealItemSheet({ item, mealLabel, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({
    name: item.name, brand: item.brand || '', unit: item.unit,
    cal: String(item.cal), p: String(item.p || 0), c: String(item.c || 0), f: String(item.f || 0),
  });
  const [busy, setBusy] = useState(false);

  const fcn = parseFloat(form.cal);
  const canSave = !!form.name.trim() && !isNaN(fcn) && fcn >= 0;
  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!canSave || busy) return;
    setBusy(true);
    try {
      await onSave({
        name: form.name.trim(), brand: form.brand.trim(), unit: form.unit.trim() || '1 份',
        cal: Math.round(fcn), p: parseFloat(form.p) || 0, c: parseFloat(form.c) || 0, f: parseFloat(form.f) || 0,
      });
      onClose();
    } catch (e) {
      alertError('儲存', e);
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    onClose();
    onDelete();
  };

  return (
    <Sheet label="編輯餐點" onBackdrop={onClose} height="min(76vh, 660px)" zIndex={12}>
      <SheetHeader title={`編輯${mealLabel}記錄`} onClose={onClose} />
      <div className="ps" style={S.body}>
        <div style={S.hint}>只會更新這一筆，不影響食物庫或其他天的記錄</div>
        <label><span style={UI.fieldLabel}>食物名稱</span><input aria-label="食物名稱" type="text" value={form.name} onChange={setField('name')} style={UI.input} /></label>
        <label><span style={UI.fieldLabel}>品牌（選填）</span><input aria-label="品牌" type="text" value={form.brand} onChange={setField('brand')} placeholder="例如：7-11" style={UI.input} /></label>
        <div style={S.cols(2)}>
          <label><span style={UI.fieldLabel}>份量</span><input aria-label="份量" type="text" value={form.unit} onChange={setField('unit')} style={UI.input} /></label>
          <label><span style={UI.fieldLabel}>卡路里</span><input aria-label="卡路里" type="number" inputMode="numeric" value={form.cal} onChange={setField('cal')} style={UI.input} /></label>
        </div>
        <div style={S.cols(3)}>
          {MACROS.map((m) => (
            <label key={m.key}>
              <span style={S.macroLabel}><span style={S.dot(m.color)} />{m.label} (g)</span>
              <input aria-label={m.label} type="number" inputMode="decimal" value={form[m.key]} onChange={setField(m.key)} style={UI.input} />
            </label>
          ))}
        </div>
        <button type="button" onClick={save} disabled={!canSave || busy} style={{ ...UI.btnPrimary, width: '100%', marginTop: 4, opacity: canSave ? 1 : 0.4 }}>{busy ? '儲存中…' : '儲存修改'}</button>
        {onDelete && (
          <button type="button" onClick={remove} style={{ ...UI.btnDangerText, alignSelf: 'center' }}><Icon name="trash" size={16} />刪除這筆</button>
        )}
      </div>
    </Sheet>
  );
}
