// 管理分類與標籤：三層結構（分類 → 主標籤 → 子標籤）。
// 分類與主標籤可收合、點名字直接進入行內改名（無框線、底線輸入框）、
// ▲▼ 排序（手機友善，不用拖曳）、子標籤是 chip、‹ › 左右排序。
// 標籤名稱（含子標籤）全域唯一，衝突時顯示提示不送出。
import React, { useState } from 'react';
import { THEME } from '../theme.js';
import { findTagOwner } from '../useDiary.js';

const S = {
  header: { display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: THEME.surface, borderBottom: `1px solid ${THEME.border}` },
  backBtn: { border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: THEME.textMuted, padding: '2px 6px', outline: 'none' },
  title: { fontSize: 17, fontWeight: 700, color: THEME.textDark },
  body: { padding: 20, display: 'flex', flexDirection: 'column', gap: 14 },
  card: { background: THEME.surface, borderRadius: THEME.radius, padding: '14px 16px', boxShadow: THEME.shadow },
  cardTop: { display: 'flex', alignItems: 'center', gap: 8 },
  reorderCol: { display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 },
  reorderBtn: (disabled) => ({ border: 'none', background: 'none', cursor: disabled ? 'default' : 'pointer', color: disabled ? THEME.textFaint : THEME.textMuted, fontSize: 12, lineHeight: 1, padding: 2, outline: 'none' }),
  catName: { flex: 1, minWidth: 0, cursor: 'text', fontSize: 15, fontWeight: 700, color: THEME.textDark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  catNameInput: { flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700, color: THEME.textDark, border: 'none', borderBottom: `1px solid ${THEME.primary}`, background: 'transparent', outline: 'none', padding: '0 0 2px' },
  chevronBtn: { cursor: 'pointer', color: THEME.textMuted, fontSize: 13, width: 22, textAlign: 'center', flexShrink: 0, userSelect: 'none' },
  deleteLabel: (confirming) => ({ cursor: 'pointer', fontSize: 12, fontWeight: 600, color: confirming ? THEME.error : THEME.textMuted, whiteSpace: 'nowrap', flexShrink: 0 }),
  tagsWrap: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 },
  tagBox: { background: THEME.surfaceAlt, borderRadius: 14, padding: '8px 12px 8px 4px' },
  tagRow: { display: 'flex', alignItems: 'center', gap: 6 },
  tagReorderCol: { display: 'flex', flexDirection: 'column', flexShrink: 0 },
  tagReorderBtn: (disabled) => ({ border: 'none', background: 'none', cursor: disabled ? 'default' : 'pointer', color: disabled ? THEME.textFaint : THEME.textMuted, fontSize: 14, lineHeight: 1, padding: '6px 9px', outline: 'none' }),
  tagName: { flex: 1, minWidth: 0, cursor: 'text', fontSize: 14, fontWeight: 500, color: THEME.textDark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  tagNameInput: { flex: 1, minWidth: 0, fontSize: 14, fontWeight: 500, color: THEME.textDark, border: 'none', borderBottom: `1px solid ${THEME.primary}`, background: 'transparent', outline: 'none' },
  subBadge: { flexShrink: 0, fontSize: 11, color: THEME.textMuted, background: THEME.primarySoft, borderRadius: 999, padding: '2px 7px' },
  tagChevron: { cursor: 'pointer', color: THEME.textMuted, fontSize: 12, width: 18, textAlign: 'center', flexShrink: 0, userSelect: 'none' },
  removeX: { cursor: 'pointer', flexShrink: 0, width: 28, height: 28, borderRadius: '50%', color: THEME.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 },
  hint: { fontSize: 11, color: THEME.error, marginTop: 4, marginLeft: 6 },
  subsWrap: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, margin: '10px 0 2px 24px' },
  subChip: { display: 'inline-flex', alignItems: 'center', gap: 4, background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: 999, padding: '4px 6px 4px 10px' },
  subName: { fontSize: 13, color: THEME.textDark, cursor: 'text' },
  subNameInput: { width: 64, fontSize: 13, color: THEME.textDark, border: 'none', background: 'transparent', outline: 'none' },
  subMoveBtn: (disabled) => ({ border: 'none', background: 'none', cursor: disabled ? 'default' : 'pointer', color: disabled ? THEME.textFaint : THEME.textMuted, fontSize: 12, lineHeight: 1, padding: '2px 3px', outline: 'none' }),
  subRemove: { cursor: 'pointer', color: THEME.textMuted, fontSize: 13, padding: '0 4px', opacity: 0.8 },
  addPill: { display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start', border: `1px dashed ${THEME.textFaint}`, borderRadius: 999, padding: '5px 12px', fontSize: 13, color: THEME.textMuted, cursor: 'pointer', background: 'transparent' },
  addSubInput: { width: 80, fontSize: 13, color: THEME.textDark, border: `1px solid ${THEME.textFaint}`, borderRadius: 999, padding: '4px 10px', outline: 'none', background: THEME.surface },
  addTagPill: { display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start', border: `1px dashed ${THEME.textFaint}`, borderRadius: 999, padding: '8px 14px', fontSize: 14, color: THEME.textMuted, cursor: 'pointer', background: 'transparent', marginTop: 4 },
  addTagInput: { alignSelf: 'stretch', fontSize: 14, color: THEME.textDark, border: `1px solid ${THEME.textFaint}`, borderRadius: 999, padding: '8px 14px', outline: 'none', background: THEME.surface, marginTop: 4 },
  moveConfirm: { marginTop: 10, background: THEME.surfaceAlt, borderRadius: 10, padding: '10px 12px' },
  moveConfirmText: { fontSize: 12, color: THEME.textDark, marginBottom: 8, lineHeight: 1.5 },
  moveConfirmActions: { display: 'flex', gap: 8 },
  moveConfirmBtn: { border: 'none', cursor: 'pointer', padding: '6px 14px', borderRadius: 8, background: THEME.primary, color: '#fff', fontSize: 12, fontWeight: 700 },
  moveCancelBtn: { border: 'none', cursor: 'pointer', padding: '6px 14px', borderRadius: 8, background: THEME.surface, color: THEME.textMuted, fontSize: 12, fontWeight: 600 },
  newCategoryCard: { background: THEME.surface, borderRadius: THEME.radius, padding: '16px 18px', boxShadow: THEME.shadow, display: 'flex', gap: 8 },
  newCategoryInput: { flex: 1, boxSizing: 'border-box', padding: '10px 12px', borderRadius: THEME.radiusSm, border: `1px solid ${THEME.border}`, fontSize: 14, color: THEME.textDark, background: THEME.surface, outline: 'none' },
  addCategoryBtn: { border: 'none', cursor: 'pointer', padding: '0 18px', borderRadius: THEME.radiusSm, background: THEME.primary, color: '#fff', fontSize: 14, fontWeight: 700 },
};

// 點名字進入行內改名的小元件：span ↔ 底線 input，Enter/失焦送出、Esc 取消。
// commitName 回傳錯誤字串表示改名被擋（例如撞名），顯示提示、維持編輯狀態。
function InlineName({ name, spanStyle, inputStyle, onCommit }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [error, setError] = useState('');

  const commit = () => {
    const val = value.trim();
    if (!val || val === name) { setEditing(false); setError(''); return; }
    const err = onCommit(val);
    if (err) { setError(err); return; }
    setEditing(false);
    setError('');
  };

  if (!editing) {
    return <span style={spanStyle} onClick={() => { setValue(name); setError(''); setEditing(true); }}>{name}</span>;
  }
  return (
    <>
      <input
        autoFocus
        style={inputStyle}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.nativeEvent.isComposing) return; if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setEditing(false); setError(''); } }}
      />
      {error && <span style={S.hint}>{error}</span>}
    </>
  );
}

// 一個主標籤：標籤列（▲▼、名字、子標籤數 badge、收合箭頭、×）＋展開後的子標籤 chip 區。
function TagBox({ tag, isFirst, isLast, allCategories, actions }) {
  const [expanded, setExpanded] = useState(false);
  const [addingSub, setAddingSub] = useState(false);
  const [subDraft, setSubDraft] = useState('');
  const [subHint, setSubHint] = useState('');

  const checkRename = (val) => {
    const owner = findTagOwner(allCategories, val);
    if (owner) return `「${val}」已經有標籤在用了，換一個名稱`;
    return null;
  };

  const submitSub = () => {
    const val = subDraft.trim();
    if (!val) { setAddingSub(false); setSubHint(''); return; }
    const owner = findTagOwner(allCategories, val);
    if (owner) { setSubHint(`「${val}」已經有標籤在用了，換一個名稱`); return; }
    actions.onAddSub(val);
    setSubDraft(''); setAddingSub(false); setSubHint('');
  };

  return (
    <div style={S.tagBox}>
      <div style={S.tagRow}>
        <div style={S.tagReorderCol}>
          <button type="button" style={S.tagReorderBtn(isFirst)} disabled={isFirst} onClick={() => actions.onMove(-1)} aria-label="標籤上移">▲</button>
          <button type="button" style={S.tagReorderBtn(isLast)} disabled={isLast} onClick={() => actions.onMove(1)} aria-label="標籤下移">▼</button>
        </div>
        <InlineName
          name={tag.name}
          spanStyle={S.tagName}
          inputStyle={S.tagNameInput}
          onCommit={(val) => { const err = checkRename(val); if (err) return err; actions.onRename(val); return null; }}
        />
        {tag.subs.length > 0 && <span style={S.subBadge}>{tag.subs.length}</span>}
        <span style={S.tagChevron} onClick={() => setExpanded((v) => !v)}>{expanded ? '▾' : '▸'}</span>
        <span style={S.removeX} onClick={actions.onRemove}>×</span>
      </div>

      {expanded && (
        <div style={S.subsWrap}>
          {tag.subs.map((sub, i) => (
            <div key={sub} style={S.subChip}>
              <button type="button" style={S.subMoveBtn(i === 0)} disabled={i === 0} onClick={() => actions.onMoveSub(sub, -1)} aria-label="子標籤左移">‹</button>
              <InlineName
                name={sub}
                spanStyle={S.subName}
                inputStyle={S.subNameInput}
                onCommit={(val) => { const err = checkRename(val); if (err) return err; actions.onRenameSub(sub, val); return null; }}
              />
              <button type="button" style={S.subMoveBtn(i === tag.subs.length - 1)} disabled={i === tag.subs.length - 1} onClick={() => actions.onMoveSub(sub, 1)} aria-label="子標籤右移">›</button>
              <span style={S.subRemove} onClick={() => actions.onRemoveSub(sub)}>×</span>
            </div>
          ))}
          {addingSub ? (
            <input
              autoFocus
              style={S.addSubInput}
              value={subDraft}
              placeholder="新子標籤"
              onChange={(e) => { setSubDraft(e.target.value); setSubHint(''); }}
              onBlur={submitSub}
              onKeyDown={(e) => { if (e.nativeEvent.isComposing) return; if (e.key === 'Enter') submitSub(); if (e.key === 'Escape') { setAddingSub(false); setSubDraft(''); setSubHint(''); } }}
            />
          ) : (
            <div style={S.addPill} onClick={() => setAddingSub(true)}>+ 新增</div>
          )}
          {subHint && <div style={S.hint}>{subHint}</div>}
        </div>
      )}
    </div>
  );
}

function CategoryCard({ category, allCategories, onRename, onDelete, onAddTag, onRemoveTag, onMoveTagHere, onMoveTagInCategory, onRenameTag, onAddSub, onRenameSub, onRemoveSub, onMoveSub, onMoveUp, onMoveDown, canMoveUp, canMoveDown }) {
  const [expanded, setExpanded] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addingTag, setAddingTag] = useState(false);
  const [tagDraft, setTagDraft] = useState('');
  const [tagHint, setTagHint] = useState('');
  const [pendingMove, setPendingMove] = useState(null); // { tag, fromCategoryId, fromName }

  const handleDeleteClick = () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    onDelete();
  };

  const submitTag = () => {
    const val = tagDraft.trim();
    if (!val) { setAddingTag(false); setTagHint(''); return; }
    if (category.tags.some((t) => t.name === val)) { setTagDraft(''); setAddingTag(false); return; }
    const owner = findTagOwner(allCategories, val);
    if (owner) {
      if (owner.isSub) { setTagHint(`「${val}」已經是「${owner.parent}」的子標籤`); return; }
      setPendingMove({ tag: val, fromCategoryId: owner.category.id, fromName: owner.category.name });
      return;
    }
    onAddTag(val);
    setTagDraft(''); setAddingTag(false); setTagHint('');
  };

  const confirmMove = () => {
    onMoveTagHere(pendingMove.tag, pendingMove.fromCategoryId);
    setPendingMove(null);
    setTagDraft(''); setAddingTag(false);
  };

  const cancelMove = () => {
    setPendingMove(null);
    setTagDraft('');
  };

  return (
    <div style={S.card}>
      <div style={S.cardTop}>
        <div style={S.reorderCol}>
          <button type="button" style={S.reorderBtn(!canMoveUp)} disabled={!canMoveUp} onClick={onMoveUp} aria-label="上移">▲</button>
          <button type="button" style={S.reorderBtn(!canMoveDown)} disabled={!canMoveDown} onClick={onMoveDown} aria-label="下移">▼</button>
        </div>
        <InlineName
          name={category.name}
          spanStyle={S.catName}
          inputStyle={S.catNameInput}
          onCommit={(val) => { onRename(val); return null; }}
        />
        <span style={S.chevronBtn} onClick={() => setExpanded((v) => !v)}>{expanded ? '▾' : '▸'}</span>
        <div style={S.deleteLabel(confirmDelete)} onClick={handleDeleteClick}>
          {confirmDelete ? '確定？' : '刪除分類'}
        </div>
      </div>

      {expanded && (
        <div style={S.tagsWrap}>
          {category.tags.map((tag, i) => (
            <TagBox
              key={tag.name}
              tag={tag}
              isFirst={i === 0}
              isLast={i === category.tags.length - 1}
              allCategories={allCategories}
              actions={{
                onMove: (dir) => onMoveTagInCategory(tag.name, dir),
                onRename: (val) => onRenameTag(tag.name, val),
                onRemove: () => onRemoveTag(tag.name),
                onAddSub: (sub) => onAddSub(tag.name, sub),
                onRenameSub: (oldSub, newSub) => onRenameSub(tag.name, oldSub, newSub),
                onRemoveSub: (sub) => onRemoveSub(tag.name, sub),
                onMoveSub: (sub, dir) => onMoveSub(tag.name, sub, dir),
              }}
            />
          ))}

          {addingTag ? (
            <input
              autoFocus
              style={S.addTagInput}
              value={tagDraft}
              placeholder="新主標籤"
              onChange={(e) => { setTagDraft(e.target.value); setTagHint(''); }}
              onBlur={() => { if (!pendingMove) submitTag(); }}
              onKeyDown={(e) => { if (e.nativeEvent.isComposing) return; if (e.key === 'Enter') { e.preventDefault(); submitTag(); } if (e.key === 'Escape') { setAddingTag(false); setTagDraft(''); setTagHint(''); } }}
            />
          ) : (
            <div style={S.addTagPill} onClick={() => setAddingTag(true)}>+ 新增主標籤</div>
          )}
          {tagHint && <div style={S.hint}>{tagHint}</div>}

          {pendingMove && (
            <div style={S.moveConfirm}>
              <div style={S.moveConfirmText}>
                「{pendingMove.tag}」已經在「{pendingMove.fromName}」分類，要移到「{category.name}」嗎？
              </div>
              <div style={S.moveConfirmActions}>
                <button type="button" style={S.moveConfirmBtn} onClick={confirmMove}>移過來</button>
                <button type="button" style={S.moveCancelBtn} onClick={cancelMove}>取消</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ManageTags({ categories, onRenameCategory, onDeleteCategory, onAddTag, onRemoveTag, onMoveTag, onMoveTagInCategory, onRenameTag, onAddSubTag, onRenameSubTag, onRemoveSubTag, onMoveSubTag, onAddCategory, onMoveCategory, onClose }) {
  const [newCategoryInput, setNewCategoryInput] = useState('');

  const submitNewCategory = () => {
    const val = newCategoryInput.trim();
    if (!val) return;
    onAddCategory(val);
    setNewCategoryInput('');
  };

  return (
    <div>
      <div style={S.header}>
        <button type="button" onClick={onClose} style={S.backBtn} aria-label="返回">←</button>
        <div style={S.title}>管理分類與標籤</div>
      </div>

      <div style={S.body}>
        {categories.map((cat, i) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            allCategories={categories}
            onRename={(name) => onRenameCategory(cat.id, name)}
            onDelete={() => onDeleteCategory(cat.id)}
            onAddTag={(tag) => onAddTag(cat.id, tag)}
            onRemoveTag={(tag) => onRemoveTag(cat.id, tag)}
            onMoveTagHere={(tag, fromCategoryId) => onMoveTag(tag, fromCategoryId, cat.id)}
            onMoveTagInCategory={(tag, direction) => onMoveTagInCategory(cat.id, tag, direction)}
            onRenameTag={(tag, newTag) => onRenameTag(cat.id, tag, newTag)}
            onAddSub={(parent, sub) => onAddSubTag(cat.id, parent, sub)}
            onRenameSub={(parent, oldSub, newSub) => onRenameSubTag(cat.id, parent, oldSub, newSub)}
            onRemoveSub={(parent, sub) => onRemoveSubTag(cat.id, parent, sub)}
            onMoveSub={(parent, sub, direction) => onMoveSubTag(cat.id, parent, sub, direction)}
            onMoveUp={() => onMoveCategory(cat.id, -1)}
            onMoveDown={() => onMoveCategory(cat.id, 1)}
            canMoveUp={i > 0}
            canMoveDown={i < categories.length - 1}
          />
        ))}

        <div style={S.newCategoryCard}>
          <input
            style={S.newCategoryInput}
            value={newCategoryInput}
            onChange={(e) => setNewCategoryInput(e.target.value)}
            onKeyDown={(e) => { if (e.nativeEvent.isComposing) return; if (e.key === 'Enter') { e.preventDefault(); submitNewCategory(); } }}
            placeholder="新增分類名稱"
          />
          <button type="button" style={S.addCategoryBtn} onClick={submitNewCategory}>新增分類</button>
        </div>
      </div>
    </div>
  );
}
