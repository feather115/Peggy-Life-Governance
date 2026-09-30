// Advanced sheet: toggles fasting/other tags for the day, edits daily AI summary (saves automatically on close).
import React, { useState } from 'react';
import { dateLabel, emptyDay, alertError, readableOn } from '../utils.js';
import { dayTotals } from '../selectors.js';
import { MEALS_DEF } from '../constants.js';
import Sheet from './Sheet.jsx';
import { confirmDialog } from '@peggy-life/shared/feedback.jsx';
import Icon from '@peggy-life/shared/Icon.jsx';

export default function AdvancedSheet({ app, selectedDate, onClose }) {
  const { days, fastingTagDefs, otherTagDefs, toggleTag, saveDayNote, goalCal, goalP, goalC, goalF } = app;
  const curDay = days[selectedDate] || emptyDay();
  const activeTags = curDay.tags?.activeTags || [];

  const [note, setNote] = useState(curDay.dayNote || '');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState('');

  // Write the summary back to the database upon closing.
  // 存檔失敗讓使用者選：留下來重試，或放棄這次修改直接關（不能卡在關不掉的面板）
  const close = async () => {
    if (note !== (curDay.dayNote || '')) {
      try {
        await saveDayNote(selectedDate, note);
      } catch (e) {
        const leave = await confirmDialog({ title: '摘要儲存失敗', message: `${e.message || '請稍後再試'}\n仍要關閉嗎？這次的修改不會保留。`, confirmText: '仍要關閉', cancelText: '留下來重試', danger: true });
        if (!leave) return;
      }
    }
    onClose();
  };

  const toggle = (id, active) => {
    toggleTag(selectedDate, id, !active).catch((e) => alertError('標籤更新', e));
  };

  // Passes today's food log + goals to AI to generate a comment, overwriting the textarea below (which can still be manually edited before saving).
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
    <Sheet label="進階設定" onBackdrop={close} height="min(75vh, 680px)" zIndex={15}>
      <div style={{ padding: '8px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 'none' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)' }}>進階</div>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', fontWeight: 700, marginTop: 1 }}>{dateLabel(selectedDate)}</div>
        </div>
        <button onClick={close} style={{ border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 800, fontSize: 14, padding: '8px 18px', borderRadius: 18, cursor: 'pointer' }}>完成</button>
      </div>
      <div className="ps" style={{ flex: 1, overflowY: 'auto', padding: '4px 18px 28px' }}>
        <TagToggleGroup title={<><Icon name="timer" size={16} />斷食</>} hint="今天的斷食方式，可複選" tags={fastingTagDefs} activeTags={activeTags} activeBg="var(--info)"
          onToggle={toggle} />
        <div style={{ height: 24 }} />
        <TagToggleGroup title={<><Icon name="tag" size={16} />記錄原因</>} hint="聚餐、外食等特殊情況，可複選" tags={otherTagDefs} activeTags={activeTags} activeBg="#E8A13C" useTagColor
          onToggle={toggle} />
        <div style={{ height: 24 }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="clipboard" size={16} />當日 AI 摘要</div>
            <button onClick={generateSummary} disabled={aiBusy} style={{ border: 'none', background: aiBusy ? 'var(--line-strong)' : 'var(--bg)', color: aiBusy ? '#fff' : 'var(--primary)', fontWeight: 800, fontSize: 12, padding: '6px 12px', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>{aiBusy ? '產生中…' : <><Icon name="sparkles" size={14} />AI 幫我寫</>}</button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', fontWeight: 700, marginBottom: 11 }}>貼上 AI 對今日飲食的評價，或點上面按鈕自動產生 · 關閉時自動儲存</div>
          {aiError && <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: 'var(--danger)' }}>{aiError}</div>}
          <textarea aria-label="當日摘要" value={note} onChange={(e) => setNote(e.target.value)} placeholder="例如：今天蛋白質達標，碳水偏高。建議明天減少精緻澱粉，多補充蔬菜纖維…" style={{ width: '100%', height: 130, border: 'none', background: 'var(--surface-alt)', borderRadius: 16, padding: '12px 14px', fontSize: 16, fontWeight: 600, color: 'var(--text)', resize: 'none', lineHeight: 1.75 }} />
        </div>
      </div>
    </Sheet>
  );
}

function TagToggleGroup({ title, hint, tags, activeTags, activeBg, useTagColor = false, onToggle }) {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--text-faint)', fontWeight: 700, marginBottom: 11 }}>{hint}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {tags.map((t) => {
          const active = activeTags.includes(t.id);
          const bg = active && useTagColor ? (t.color || activeBg) : active ? activeBg : 'var(--sunken)';
          return (
            <button key={t.id} onClick={() => onToggle(t.id, active)} aria-pressed={active} style={{ border: 'none', background: bg, color: active ? readableOn(bg) : 'var(--text-muted)', padding: '11px 20px', borderRadius: 22, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>{t.label}</button>
          );
        })}
      </div>
    </div>
  );
}
