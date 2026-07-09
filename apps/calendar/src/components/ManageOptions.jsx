// 設定頁的「管理地點、人名與標籤」：維護表單下拉選單的選項庫（event_options）。
// 改名會同步改寫過去引用的事件/日記（同層同名自動合併）；封存只影響之後的選單，
// 過去紀錄照舊保留；使用 0 次（標籤還要沒有子標籤）才能永久刪除。
import React, { useMemo, useState } from 'react';
import { THEME } from '../theme.js';

const S = {
  header: { display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: THEME.surface, borderBottom: `1px solid ${THEME.border}` },
  backBtn: { border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: THEME.textMuted, padding: '2px 6px', outline: 'none' },
  title: { fontSize: 17, fontWeight: 700, color: THEME.textDark },
  body: { padding: '20px 20px 48px', display: 'flex', flexDirection: 'column', gap: 28 },
  errorBox: { background: THEME.errorBg, color: THEME.error, padding: '10px 12px', borderRadius: THEME.radiusSm, fontSize: 13, fontWeight: 600 },
  sectionName: { fontSize: 14, fontWeight: 700, color: THEME.textDark, marginBottom: 4 },
  sectionHint: { fontSize: 12.5, color: THEME.textFaint, marginBottom: 10 },
  rows: { display: 'flex', flexDirection: 'column', gap: 8 },
  row: (archived) => ({ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: THEME.radiusSm, border: `1px solid ${THEME.border}`, background: THEME.surface, opacity: archived ? 0.5 : 1 }),
  childRow: (archived) => ({ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: THEME.radiusSmInner, border: `1px solid ${THEME.border}`, background: THEME.surfaceAlt, opacity: archived ? 0.5 : 1 }),
  childMark: { color: THEME.textFaint, fontSize: 13, flexShrink: 0 },
  rowInput: (bold) => ({ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontSize: bold ? 15 : 14, fontWeight: bold ? 600 : 400, color: THEME.textDark, background: 'transparent' }),
  usage: { fontSize: 12, color: THEME.textFaint, whiteSpace: 'nowrap' },
  toggleBtn: { border: `1px solid ${THEME.border}`, background: THEME.surface, borderRadius: THEME.radiusSmInner, padding: '5px 10px', fontSize: 12.5, color: THEME.textMuted, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  deleteBtn: { border: 'none', background: 'none', color: THEME.error, cursor: 'pointer', fontSize: 14, padding: '0 2px' },
  addRow: (indent) => ({ display: 'flex', alignItems: 'center', gap: 8, marginTop: indent ? 0 : 10, padding: '8px 12px', borderRadius: THEME.radiusSm, border: `1px dashed ${THEME.textFaint}`, background: indent ? 'transparent' : THEME.surface }),
  addInput: { flex: 1, minWidth: 0, border: 'none', outline: 'none', fontSize: 14, color: THEME.textDark, background: 'transparent' },
  tagCard: { border: `1px solid ${THEME.border}`, borderRadius: THEME.radiusSm, background: THEME.surface, padding: 10 },
  tagCardTop: (archived) => ({ display: 'flex', alignItems: 'center', gap: 8, opacity: archived ? 0.5 : 1 }),
  children: { display: 'flex', flexDirection: 'column', gap: 6, margin: '10px 0 0 18px' },
  empty: { fontSize: 13, color: THEME.textFaint },
};

// 一列選項：名字（點進去直接改，Blur/Enter 送出）、使用次數、封存/恢復、永久刪除（沒被用到才出現）。
// variant：'row' 一般列、'child' 縮排子標籤列、'cardTop' 標籤卡片的母標籤列（沒有自己的框）。
function OptionRow({ option, usage, canDelete, onRename, onToggleArchive, onDelete, variant = 'row' }) {
  const [draft, setDraft] = useState(null); // null = 沒在編輯，顯示現值

  const commit = () => {
    if (draft === null) return;
    const val = draft;
    setDraft(null);
    if (val.trim() && val.trim() !== option.name) onRename(val);
  };

  const rowStyle = variant === 'child' ? S.childRow(option.archived)
    : variant === 'cardTop' ? S.tagCardTop(option.archived)
    : S.row(option.archived);
  return (
    <div style={rowStyle}>
      {variant === 'child' && <span style={S.childMark}>└</span>}
      <input
        type="text"
        style={S.rowInput(variant === 'cardTop')}
        value={draft ?? option.name}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setDraft(null); }}
      />
      <span style={S.usage}>使用 {usage} 次</span>
      <button type="button" style={S.toggleBtn} onClick={onToggleArchive}>{option.archived ? '恢復' : '封存'}</button>
      {canDelete && <button type="button" style={S.deleteBtn} title="永久刪除" onClick={onDelete}>🗑</button>}
    </div>
  );
}

// 虛線的「＋ 新增」輸入列，Enter 送出
function AddRow({ placeholder, onAdd, indent }) {
  const [draft, setDraft] = useState('');
  const submit = () => {
    const val = draft.trim();
    setDraft('');
    if (val) onAdd(val);
  };
  return (
    <div style={S.addRow(indent)}>
      {indent && <span style={S.childMark}>└</span>}
      <input
        type="text"
        style={S.addInput}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
        placeholder={placeholder}
      />
    </div>
  );
}

export default function ManageOptions({ opts, events, entries, renameEventField, renameDiaryField, onClose }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // 每個名字被過去紀錄用了幾次（地點/人名算事件+日記，標籤只有事件有）
  const usage = useMemo(() => {
    const count = new Map();
    const bump = (kind, name) => {
      if (!name) return;
      const key = `${kind}:${name}`;
      count.set(key, (count.get(key) || 0) + 1);
    };
    events.forEach((ev) => {
      bump('location', ev.location);
      (ev.people || []).forEach((p) => bump('person', p));
      (ev.tags || []).forEach((t) => bump('tag', t));
    });
    entries.forEach((e) => {
      bump('location', e.location);
      (e.people || []).forEach((p) => bump('person', p));
    });
    return count;
  }, [events, entries]);
  const usageOf = (o) => usage.get(`${o.kind}:${o.name}`) || 0;

  const run = async (fn) => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      await fn();
    } catch (e) {
      setError(e.message || '操作失敗');
    }
    setBusy(false);
  };

  // 改名：先改選項庫（同層同名會自動合併），再同步改寫過去引用的事件/日記
  const rename = (option, newName) => run(async () => {
    const result = await opts.renameOption(option.id, newName);
    if (!result) return;
    const { kind, oldName, newName: name } = result;
    if (kind === 'location') {
      await renameEventField('location', oldName, name);
      await renameDiaryField('location', oldName, name);
    } else if (kind === 'person') {
      await renameEventField('people', oldName, name);
      await renameDiaryField('people', oldName, name);
    } else {
      await renameEventField('tags', oldName, name);
    }
  });

  const toggleArchive = (option) => run(() => opts.setArchived(option.id, !option.archived));

  const remove = (option) => {
    if (!window.confirm(`確定要永久刪除「${option.name}」嗎？`)) return;
    run(() => opts.removeOption(option.id));
  };

  const canDelete = (option) =>
    usageOf(option) === 0 && !(option.kind === 'tag' && opts.options.some((o) => o.parent_id === option.id));

  const locations = opts.options.filter((o) => o.kind === 'location');
  const people = opts.options.filter((o) => o.kind === 'person');
  const topTags = opts.options.filter((o) => o.kind === 'tag' && !o.parent_id);

  return (
    <div>
      <div style={S.header}>
        <button type="button" onClick={onClose} style={S.backBtn} aria-label="返回">←</button>
        <div style={S.title}>管理地點、人名與事件標籤</div>
      </div>

      <div style={S.body}>
        {opts.loadError && <div style={S.errorBox}>選項庫載入失敗：{opts.loadError}（可能還沒執行 2026-07-09_event_options.sql migration）</div>}
        {error && <div style={S.errorBox}>{error}</div>}

        <div>
          <div style={S.sectionName}>地點</div>
          <div style={S.sectionHint}>封存後，過去事件/日記仍會保留此地點，但之後不會再出現於選單中。改名會同步改過去的紀錄，同名自動合併。</div>
          <div style={S.rows}>
            {locations.map((o) => (
              <OptionRow key={o.id} option={o} usage={usageOf(o)} canDelete={canDelete(o)}
                onRename={(v) => rename(o, v)} onToggleArchive={() => toggleArchive(o)} onDelete={() => remove(o)} />
            ))}
            {locations.length === 0 && <div style={S.empty}>還沒有任何地點</div>}
          </div>
          <AddRow placeholder="＋ 新增地點，按 Enter" onAdd={(v) => run(() => opts.addOption('location', v))} />
        </div>

        <div>
          <div style={S.sectionName}>和誰（人名）</div>
          <div style={S.sectionHint}>封存後，過去事件/日記仍會保留此人名，但之後不會再出現於選單中。改名會同步改過去的紀錄，同名自動合併。</div>
          <div style={S.rows}>
            {people.map((o) => (
              <OptionRow key={o.id} option={o} usage={usageOf(o)} canDelete={canDelete(o)}
                onRename={(v) => rename(o, v)} onToggleArchive={() => toggleArchive(o)} onDelete={() => remove(o)} />
            ))}
            {people.length === 0 && <div style={S.empty}>還沒有任何人名</div>}
          </div>
          <AddRow placeholder="＋ 新增人名，按 Enter" onAdd={(v) => run(() => opts.addOption('person', v))} />
        </div>

        <div>
          <div style={S.sectionName}>事件標籤</div>
          <div style={S.sectionHint}>每個標籤可以有子標籤。封存後過去事件仍保留紀錄，但不會再出現於選單中；母標籤封存時整組都不會出現。同名同層自動合併（含子標籤）。日記的分類與標籤在另一頁「管理分類與標籤」。</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {topTags.map((top) => {
              const children = opts.options.filter((o) => o.parent_id === top.id);
              return (
                <div key={top.id} style={S.tagCard}>
                  <OptionRow option={top} usage={usageOf(top)} canDelete={canDelete(top)} variant="cardTop"
                    onRename={(v) => rename(top, v)} onToggleArchive={() => toggleArchive(top)} onDelete={() => remove(top)} />
                  <div style={S.children}>
                    {children.map((c) => (
                      <OptionRow key={c.id} option={c} usage={usageOf(c)} canDelete={canDelete(c)} variant="child"
                        onRename={(v) => rename(c, v)} onToggleArchive={() => toggleArchive(c)} onDelete={() => remove(c)} />
                    ))}
                    <AddRow indent placeholder="＋ 新增子標籤，按 Enter" onAdd={(v) => run(() => opts.addOption('tag', v, top.id))} />
                  </div>
                </div>
              );
            })}
            {topTags.length === 0 && <div style={S.empty}>還沒有任何事件標籤</div>}
          </div>
          <AddRow placeholder="＋ 新增標籤，按 Enter" onAdd={(v) => run(() => opts.addOption('tag', v))} />
        </div>
      </div>
    </div>
  );
}
