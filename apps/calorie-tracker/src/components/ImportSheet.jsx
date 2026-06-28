// JSON import sheet: paste food JSON output from AI, parse it, and bulk-add to custom food library.
import React, { useState } from 'react';
import Sheet from './Sheet.jsx';

export default function ImportSheet({ app, onClose }) {
  const { importFoods } = app;
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(0);

  const run = async () => {
    try {
      const raw = text.trim();
      if (!raw) { setError('請先貼上 JSON 內容'); return; }
      let arr = JSON.parse(raw);
      if (!Array.isArray(arr)) arr = [arr];
      const valid = [];
      arr.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        const name = (item.name || '').trim();
        const cal = parseFloat(item.cal || item.calories || item.kcal || 0);
        if (!name || isNaN(cal) || cal < 0) return;
        valid.push({
          name, unit: (item.unit || item.serving || '1 份').toString().trim(), cal: Math.round(cal),
          p: parseFloat(item.p || item.protein || 0) || 0,
          c: parseFloat(item.c || item.carb || item.carbs || item.carbohydrate || 0) || 0,
          f: parseFloat(item.f || item.fat || 0) || 0,
          brand: (item.brand || '').toString().trim(),
          note: (item.note || item.notes || '').toString().trim(),
        });
      });
      if (valid.length === 0) { setError('沒找到有效食物，請確認有 name 和 cal'); return; }
      const count = await importFoods(valid);
      setSuccess(count);
      setError('');
    } catch (e) {
      setError('匯入失敗：' + (e.message || ''));
    }
  };

  return (
    <Sheet onBackdrop={onClose} height="min(80vh, 760px)" zIndex={20}>
      <div style={{ padding: '8px 20px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><div style={{ fontSize: 18, fontWeight: 900, color: '#234034' }}>匯入 JSON 食物</div><div style={{ fontSize: 12, color: '#6E8B7C', fontWeight: 700, marginTop: 2 }}>貼上 AI 輸出的 JSON</div></div>
        <button onClick={onClose} style={{ border: 'none', background: '#EAF5EE', color: '#6E8B7C', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 16, lineHeight: 1, fontWeight: 700 }}>×</button>
      </div>
      <div style={{ margin: '4px 18px 8px', background: '#F6FAF7', borderRadius: 14, padding: '10px 12px' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#6E8B7C', marginBottom: 4 }}>支援格式</div>
        <div style={{ fontSize: 11, color: '#9bb0a3', fontWeight: 700, lineHeight: 1.6, fontFamily: 'monospace' }}>[{`{"name":"雞腿便當","cal":680,"p":35,"c":70,"f":22,"brand":"7-11","note":"去冰半糖"}`}]</div>
        <div style={{ fontSize: 10, color: '#bcccc2', fontWeight: 600, marginTop: 4 }}>brand / note 選填</div>
      </div>
      <div className="ps" style={{ flex: 1, overflowY: 'auto', padding: '0 18px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <textarea value={text} onChange={(e) => { setText(e.target.value); setError(''); setSuccess(0); }} placeholder="貼上 JSON…" style={{ width: '100%', flex: 1, minHeight: 140, border: 'none', background: '#F6FAF7', borderRadius: 16, padding: '12px 14px', fontSize: 16, fontWeight: 600, color: '#234034', fontFamily: 'monospace', resize: 'none', lineHeight: 1.6 }} />
        {error && <div style={{ background: '#FEE2E2', borderRadius: 12, padding: '10px 12px', fontSize: 13, fontWeight: 700, color: '#B91C1C' }}>{error}</div>}
        {success > 0 && <div style={{ background: '#DCFCE7', borderRadius: 12, padding: '10px 12px', fontSize: 13, fontWeight: 800, color: '#15803D' }}>成功匯入 {success} 筆食物</div>}
        <button onClick={run} style={{ width: '100%', border: 'none', background: '#2E8B5E', color: '#fff', fontWeight: 900, fontSize: 14, padding: 14, borderRadius: 16, cursor: 'pointer' }}>匯入到食物庫</button>
      </div>
    </Sheet>
  );
}
