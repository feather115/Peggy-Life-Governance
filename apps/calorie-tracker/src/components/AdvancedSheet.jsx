// 進階面板：切換當日斷食/記錄原因標籤、編輯當日 AI 摘要（關閉時自動存摘要）
import React, { useState } from 'react';
import { dateLabel, emptyDay } from '../utils.js';
import { dayTotals } from '../selectors.js';
import { MEALS_DEF } from '../constants.js';
import Sheet from './Sheet.jsx';

export default function AdvancedSheet({ app, selectedDate, onClose }) {
  const { days, fastingTagDefs, otherTagDefs, toggleTag, saveDayNote, goalCal, goalP, goalC, goalF } = app;
  const curDay = days[selectedDate] || emptyDay();
  const activeTags = curDay.tags?.activeTags || [];

  const [note, setNote] = useState(curDay.dayNote || '');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState('');

  // 關閉時把摘要寫回資料庫
  const close = async () => {
    if (note !== (curDay.dayNote || '')) await saveDayNote(selectedDate, note);
    onClose();
  };

  // 把今天實際吃的東西＋目標丟給 AI，請它寫一段評語，直接覆蓋到下面的文字框（送出前都還能自己改）
  const generateSummary = async () => {
    setAiBusy(true); setAiError('');
    try {
      const meals = MEALS_DEF.map((m) => ({ label: m.label, items: curDay.meals?.[m.key] || [] }))
        .filter((m) => m.items.length > 0);
      const totals = dayTotals(curDay);
      const tagLabels = [...fastingTagDefs, ...otherTagDefs]
        .filter((t) => activeTags.includes(t.id)).map((t) => t.label);
      const res = await fetch('/api/day-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meals,
          totals: { cal: Math.round(totals.cal), p: Math.round(totals.p), c: Math.round(totals.c), f: Math.round(totals.f) },
          goal: { cal: goalCal, p: goalP, c: goalC, f: goalF },
          tags: tagLabels,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '產生摘要失敗');
      setNote(data.summary);
    } catch (e) {
      setAiError(e.message || '產生摘要失敗');
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <Sheet onBackdrop={close} height="min(75vh, 680px)" zIndex={15}>
      <div style={{ padding: '8px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 'none' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#234034' }}>進階</div>
          <div style={{ fontSize: 12, color: '#9bb0a3', fontWeight: 700, marginTop: 1 }}>{dateLabel(selectedDate)}</div>
        </div>
        <button onClick={close} style={{ border: 'none', background: '#2E8B5E', color: '#fff', fontWeight: 800, fontSize: 14, padding: '8px 18px', borderRadius: 18, cursor: 'pointer' }}>完成</button>
      </div>
      <div className="ps" style={{ flex: 1, overflowY: 'auto', padding: '4px 18px 28px' }}>
        <TagToggleGroup title="⏱ 斷食" hint="今天的斷食方式，可複選" tags={fastingTagDefs} activeTags={activeTags} activeBg="#4361EE"
          onToggle={(id, active) => toggleTag(selectedDate, id, !active)} />
        <div style={{ height: 24 }} />
        <TagToggleGroup title="🏷 記錄原因" hint="聚餐、外食等特殊情況，可複選" tags={otherTagDefs} activeTags={activeTags} activeBg="#E8A13C" useTagColor
          onToggle={(id, active) => toggleTag(selectedDate, id, !active)} />
        <div style={{ height: 24 }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#234034' }}>📋 當日 AI 摘要</div>
            <button onClick={generateSummary} disabled={aiBusy} style={{ border: 'none', background: aiBusy ? '#C7D6CC' : '#EAF5EE', color: aiBusy ? '#fff' : '#2E8B5E', fontWeight: 800, fontSize: 12, padding: '6px 12px', borderRadius: 12, cursor: 'pointer' }}>{aiBusy ? '產生中…' : '✨ AI 幫我寫'}</button>
          </div>
          <div style={{ fontSize: 12, color: '#9bb0a3', fontWeight: 700, marginBottom: 11 }}>貼上 AI 對今日飲食的評價，或點上面按鈕自動產生 · 關閉時自動儲存</div>
          {aiError && <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: '#B91C1C' }}>{aiError}</div>}
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="例如：今天蛋白質達標，碳水偏高。建議明天減少精緻澱粉，多補充蔬菜纖維…" style={{ width: '100%', height: 130, border: 'none', background: '#F6FAF7', borderRadius: 16, padding: '12px 14px', fontSize: 16, fontWeight: 600, color: '#234034', resize: 'none', lineHeight: 1.75 }} />
        </div>
      </div>
    </Sheet>
  );
}

function TagToggleGroup({ title, hint, tags, activeTags, activeBg, useTagColor = false, onToggle }) {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 900, color: '#234034', marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 12, color: '#9bb0a3', fontWeight: 700, marginBottom: 11 }}>{hint}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {tags.map((t) => {
          const active = activeTags.includes(t.id);
          const bg = active && useTagColor ? (t.color || activeBg) : active ? activeBg : '#F0F3F1';
          return (
            <button key={t.id} onClick={() => onToggle(t.id, active)} style={{ border: 'none', background: bg, color: active ? '#fff' : '#6E8B7C', padding: '11px 20px', borderRadius: 22, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>{t.label}</button>
          );
        })}
      </div>
    </div>
  );
}
