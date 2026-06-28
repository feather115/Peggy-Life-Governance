// 編輯「已經加入今天的某一筆餐點」：名稱/品牌/份量/卡路里/三大營養素
// 只改這一筆記錄，不影響食物庫定義，也不影響其他天的歷史記錄
import React, { useState } from 'react';
import Sheet from './Sheet.jsx';

export default function EditMealItemSheet({ item, mealLabel, onSave, onClose }) {
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
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet onBackdrop={onClose} height="min(70vh, 640px)" zIndex={12}>
      <div style={{ padding: '8px 20px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 900, color: '#234034' }}>編輯{mealLabel}記錄</span>
        <button onClick={onClose} style={{ border: 'none', background: '#F0F3F1', color: '#6E8B7C', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 16, lineHeight: 1, fontWeight: 700 }}>×</button>
      </div>
      <div className="ps" style={{ flex: 1, overflowY: 'auto', padding: '6px 20px 20px' }}>
        <div style={{ fontSize: 12, color: '#9bb0a3', fontWeight: 700, marginBottom: 10 }}>只會更新今天這一筆，不影響食物庫或其他天的記錄</div>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#6E8B7C' }}>食物名稱</div>
        <input type="text" value={form.name} onChange={setField('name')} style={{ width: '100%', marginTop: 5, border: 'none', background: '#F6FAF7', borderRadius: 12, padding: '12px 14px', fontSize: 16, fontWeight: 700, color: '#234034' }} />
        <div style={{ marginTop: 12, fontSize: 13, fontWeight: 800, color: '#6E8B7C' }}>品牌（選填）</div>
        <input type="text" value={form.brand} onChange={setField('brand')} placeholder="例如：7-11" style={{ width: '100%', marginTop: 5, border: 'none', background: '#F6FAF7', borderRadius: 12, padding: '12px 14px', fontSize: 16, fontWeight: 700, color: '#234034' }} />
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 800, color: '#6E8B7C' }}>份量</div><input type="text" value={form.unit} onChange={setField('unit')} style={{ width: '100%', marginTop: 5, border: 'none', background: '#F6FAF7', borderRadius: 12, padding: 12, fontSize: 16, fontWeight: 700, color: '#234034' }} /></div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 800, color: '#6E8B7C' }}>卡路里</div><input type="number" inputMode="numeric" value={form.cal} onChange={setField('cal')} style={{ width: '100%', marginTop: 5, border: 'none', background: '#F6FAF7', borderRadius: 12, padding: 12, fontSize: 16, fontWeight: 700, color: '#234034' }} /></div>
        </div>
        <div style={{ marginTop: 14, fontSize: 13, fontWeight: 800, color: '#6E8B7C' }}>三大營養素 (g)</div>
        <div style={{ marginTop: 5, display: 'flex', gap: 8 }}>
          {[{ key: 'p', label: '蛋白質', color: '#2E8B5E' }, { key: 'c', label: '碳水', color: '#E8A13C' }, { key: 'f', label: '脂肪', color: '#5FA8D3' }].map((m) => (
            <div key={m.key} style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: m.color, marginBottom: 3 }}>{m.label}</div>
              <input type="number" inputMode="decimal" value={form[m.key]} onChange={setField(m.key)} style={{ width: '100%', border: 'none', background: '#F6FAF7', borderRadius: 12, padding: '12px 10px', fontSize: 16, fontWeight: 700, color: '#234034' }} />
            </div>
          ))}
        </div>
        <button onClick={save} disabled={!canSave || busy} style={{ width: '100%', marginTop: 18, border: 'none', background: canSave ? '#2E8B5E' : '#C7D6CC', color: '#fff', fontWeight: 900, fontSize: 14, padding: 14, borderRadius: 16, cursor: 'pointer' }}>{busy ? '儲存中…' : '儲存修改'}</button>
      </div>
    </Sheet>
  );
}
