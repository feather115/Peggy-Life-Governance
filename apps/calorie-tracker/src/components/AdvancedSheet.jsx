// Advanced sheet: toggles fasting/other tags for the day, edits daily AI summary (saves automatically on close).
import React, { useState } from 'react';
import { dateLabel, emptyDay, alertError, readableOn } from '../utils.js';
import { dayTotals } from '../selectors.js';
import { MEALS_DEF } from '../constants.js';
import Sheet, { SheetHeader } from './Sheet.jsx';
import { confirmDialog } from '@peggy-life/shared/feedback.jsx';
import Icon from '@peggy-life/shared/Icon.jsx';
import { UI } from '@peggy-life/shared/ui';

const S = {
  body: { flex: 1, overflowY: 'auto', padding: '4px 20px 28px', display: 'flex', flexDirection: 'column', gap: 28 },
  groupTitle: { ...UI.sectionTitle, display: 'flex', alignItems: 'center', gap: 6 },
  hint: { fontSize: 13, color: 'var(--text-muted)', marginTop: 4, marginBottom: 12, lineHeight: 1.5 },
  headRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  toggle: (on, bg) => ({ ...UI.chip(on), minHeight: 36, ...(on ? { background: bg, color: readableOn(bg) } : {}) }),
};

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
    <Sheet label="進階設定" onBackdrop={close} height="min(78vh, 700px)" zIndex={15}>
      <SheetHeader title="進階設定" subtitle={`${dateLabel(selectedDate)} · 關閉時自動儲存`} onClose={close} closeLabel="完成" />
      <div className="ps" style={S.body}>
        <TagToggleGroup title={<><Icon name="timer" size={18} />斷食</>} hint="今天的斷食方式，可複選" tags={fastingTagDefs} activeTags={activeTags} activeBg="var(--info)"
          onToggle={toggle} />
        <TagToggleGroup title={<><Icon name="tag" size={18} />記錄原因</>} hint="聚餐、外食等特殊情況，可複選" tags={otherTagDefs} activeTags={activeTags} activeBg="#E8A13C" useTagColor
          onToggle={toggle} />
        <div>
          <div style={S.headRow}>
            <div style={S.groupTitle}><Icon name="clipboard" size={18} />當日 AI 摘要</div>
            <button type="button" onClick={generateSummary} disabled={aiBusy} style={{ ...UI.btnSecondary, minHeight: 36, opacity: aiBusy ? 0.6 : 1 }}>{aiBusy ? '產生中…' : <><Icon name="sparkles" size={16} />AI 幫我寫</>}</button>
          </div>
          <div style={S.hint}>貼上 AI 對今日飲食的評價，或按「AI 幫我寫」自動產生</div>
          {aiError && <div style={{ ...UI.note('danger'), marginBottom: 8 }}>{aiError}</div>}
          <textarea aria-label="當日摘要" value={note} onChange={(e) => setNote(e.target.value)} placeholder="例如：今天蛋白質達標，碳水偏高。建議明天減少精緻澱粉，多補充蔬菜纖維…" style={{ ...UI.textarea, height: 140, resize: 'none' }} />
        </div>
      </div>
    </Sheet>
  );
}

function TagToggleGroup({ title, hint, tags, activeTags, activeBg, useTagColor = false, onToggle }) {
  return (
    <div>
      <div style={S.groupTitle}>{title}</div>
      <div style={S.hint}>{hint}</div>
      <div style={UI.chipRow}>
        {tags.map((t) => {
          const active = activeTags.includes(t.id);
          const bg = useTagColor ? (t.color || activeBg) : activeBg;
          return (
            <button key={t.id} type="button" onClick={() => onToggle(t.id, active)} aria-pressed={active} style={S.toggle(active, bg)}>
              {active && <Icon name="check" size={16} strokeWidth={2} />}{t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
