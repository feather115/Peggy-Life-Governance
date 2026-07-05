// 管理分類與標籤：改名分類、刪除分類、每個分類底下新增/刪除標籤、新增分類。
import React, { useState } from 'react';
import { THEME } from '../theme.js';

const S = {
  header: { display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: THEME.surface, borderBottom: `1px solid ${THEME.border}` },
  backBtn: { border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: THEME.textMuted, padding: '2px 6px', outline: 'none' },
  title: { fontSize: 17, fontWeight: 700, color: THEME.textDark },
  body: { padding: 20, display: 'flex', flexDirection: 'column', gap: 14 },
  card: { background: THEME.surface, borderRadius: THEME.radius, padding: '16px 18px', boxShadow: THEME.shadow },
  cardTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
  cardTopLeft: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 },
  reorderCol: { display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 },
  reorderBtn: (disabled) => ({ border: 'none', background: 'none', cursor: disabled ? 'default' : 'pointer', color: disabled ? THEME.textFaint : THEME.textMuted, fontSize: 12, lineHeight: 1, padding: 2, outline: 'none' }),
  nameText: { cursor: 'pointer', fontSize: 15, fontWeight: 700, color: THEME.textDark, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  nameEditIcon: { fontSize: 12, color: THEME.textFaint, fontWeight: 500 },
  renameInput: { flex: 1, boxSizing: 'border-box', padding: '6px 10px', borderRadius: 8, border: `1px solid ${THEME.primary}`, fontSize: 15, fontWeight: 700, color: THEME.textDark, background: THEME.surface, outline: 'none' },
  deleteLabel: (confirming) => ({ cursor: 'pointer', fontSize: 12, fontWeight: 600, color: confirming ? THEME.error : THEME.textMuted, whiteSpace: 'nowrap' }),
  tagsWrap: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 },
  tagRow: { display: 'flex', alignItems: 'center', gap: 8, background: THEME.surfaceAlt, padding: '6px 8px 6px 4px', borderRadius: 12 },
  tagReorderCol: { display: 'flex', flexDirection: 'column', flexShrink: 0 },
  tagReorderBtn: (disabled) => ({ border: 'none', background: 'none', cursor: disabled ? 'default' : 'pointer', color: disabled ? THEME.textFaint : THEME.textMuted, fontSize: 15, lineHeight: 1, padding: '7px 10px', outline: 'none' }),
  tagLabel: { flex: 1, minWidth: 0, cursor: 'pointer', fontSize: 14, color: THEME.textDark, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 },
  tagRenameInput: { flex: 1, minWidth: 0, boxSizing: 'border-box', padding: '6px 8px', borderRadius: 8, border: `1px solid ${THEME.primary}`, fontSize: 14, fontWeight: 500, color: THEME.textDark, background: THEME.surface, outline: 'none' },
  tagRemove: { cursor: 'pointer', flexShrink: 0, width: 30, height: 30, borderRadius: '50%', background: THEME.bg, color: THEME.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 },
  tagRenameHint: { fontSize: 11, color: THEME.error, marginTop: -2, marginLeft: 4, marginBottom: 4 },
  addRow: { display: 'flex', gap: 8 },
  tagInput: { flex: 1, boxSizing: 'border-box', padding: '8px 10px', borderRadius: 8, border: `1px dashed ${THEME.textFaint}`, fontSize: 13, color: THEME.textDark, background: 'transparent', outline: 'none' },
  addTagBtn: { border: 'none', cursor: 'pointer', padding: '0 14px', borderRadius: 8, background: THEME.primarySoft, color: THEME.primary, fontSize: 13, fontWeight: 700 },
  moveConfirm: { marginTop: 10, background: THEME.surfaceAlt, borderRadius: 10, padding: '10px 12px' },
  moveConfirmText: { fontSize: 12, color: THEME.textDark, marginBottom: 8, lineHeight: 1.5 },
  moveConfirmActions: { display: 'flex', gap: 8 },
  moveConfirmBtn: { border: 'none', cursor: 'pointer', padding: '6px 14px', borderRadius: 8, background: THEME.primary, color: '#fff', fontSize: 12, fontWeight: 700 },
  moveCancelBtn: { border: 'none', cursor: 'pointer', padding: '6px 14px', borderRadius: 8, background: THEME.surface, color: THEME.textMuted, fontSize: 12, fontWeight: 600 },
  newCategoryCard: { background: THEME.surface, borderRadius: THEME.radius, padding: '16px 18px', boxShadow: THEME.shadow, display: 'flex', gap: 8 },
  newCategoryInput: { flex: 1, boxSizing: 'border-box', padding: '10px 12px', borderRadius: THEME.radiusSm, border: `1px solid ${THEME.border}`, fontSize: 14, color: THEME.textDark, background: THEME.surface, outline: 'none' },
  addCategoryBtn: { border: 'none', cursor: 'pointer', padding: '0 18px', borderRadius: THEME.radiusSm, background: THEME.primary, color: '#fff', fontSize: 14, fontWeight: 700 },
};

// 一個標籤的列：左邊 ▲▼（比分類的大一號，手機上比較好點）、中間點一下進入改名模式、右邊刪除。
// 改名不能改成別的分類已經在用的名字（維持標籤名稱跨分類唯一的規則），衝突時顯示錯誤提示、不送出。
function TagRow({ tag, index, isFirst, isLast, allCategories, onRemove, onRename, onMoveUp, onMoveDown }) {
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(tag);
  const [error, setError] = useState('');

  const commitRename = () => {
    const val = renameValue.trim();
    if (!val || val === tag) { setRenaming(false); setError(''); return; }
    const existsElsewhere = allCategories.some((c) => c.tags.includes(val));
    if (existsElsewhere) {
      setError(`「${val}」已經有標籤在用了，換一個名稱`);
      return;
    }
    onRename(val);
    setRenaming(false);
    setError('');
  };

  return (
    <div>
      <div style={S.tagRow}>
        <div style={S.tagReorderCol}>
          <button type="button" style={S.tagReorderBtn(isFirst)} disabled={isFirst} onClick={onMoveUp} aria-label="標籤上移">▲</button>
          <button type="button" style={S.tagReorderBtn(isLast)} disabled={isLast} onClick={onMoveDown} aria-label="標籤下移">▼</button>
        </div>
        {renaming ? (
          <input
            autoFocus
            style={S.tagRenameInput}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setRenaming(false); setError(''); } }}
          />
        ) : (
          <div style={S.tagLabel} onClick={() => { setRenameValue(tag); setRenaming(true); setError(''); }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{tag}</span>
            <span style={{ fontSize: 11, color: THEME.textFaint }}>✎</span>
          </div>
        )}
        <span style={S.tagRemove} onClick={onRemove}>×</span>
      </div>
      {error && <div style={S.tagRenameHint}>{error}</div>}
    </div>
  );
}

function CategoryCard({ category, allCategories, onRename, onDelete, onAddTag, onRemoveTag, onMoveTagHere, onMoveTagInCategory, onRenameTag, onMoveUp, onMoveDown, canMoveUp, canMoveDown }) {
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(category.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tagDraft, setTagDraft] = useState('');
  const [pendingMove, setPendingMove] = useState(null); // { tag, fromCategoryId, fromName }

  const commitRename = () => {
    const val = renameValue.trim();
    setRenaming(false);
    if (val && val !== category.name) onRename(val);
  };

  const handleDeleteClick = () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    onDelete();
  };

  const addTag = () => {
    const val = tagDraft.trim();
    if (!val || category.tags.includes(val)) { setTagDraft(''); return; }
    const owner = allCategories.find((c) => c.id !== category.id && c.tags.includes(val));
    if (owner) {
      setPendingMove({ tag: val, fromCategoryId: owner.id, fromName: owner.name });
      return;
    }
    onAddTag(val);
    setTagDraft('');
  };

  const confirmMove = () => {
    onMoveTagHere(pendingMove.tag, pendingMove.fromCategoryId);
    setPendingMove(null);
    setTagDraft('');
  };

  const cancelMove = () => {
    setPendingMove(null);
    setTagDraft('');
  };

  return (
    <div style={S.card}>
      <div style={S.cardTop}>
        <div style={S.cardTopLeft}>
          <div style={S.reorderCol}>
            <button type="button" style={S.reorderBtn(!canMoveUp)} disabled={!canMoveUp} onClick={onMoveUp} aria-label="上移">▲</button>
            <button type="button" style={S.reorderBtn(!canMoveDown)} disabled={!canMoveDown} onClick={onMoveDown} aria-label="下移">▼</button>
          </div>
          {renaming ? (
            <input
              style={S.renameInput}
              value={renameValue}
              autoFocus
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); }}
            />
          ) : (
            <div style={S.nameText} onClick={() => { setRenameValue(category.name); setRenaming(true); }}>
              {category.name} <span style={S.nameEditIcon}>✎</span>
            </div>
          )}
        </div>
        <div style={S.deleteLabel(confirmDelete)} onClick={handleDeleteClick}>
          {confirmDelete ? '確定？' : '刪除分類'}
        </div>
      </div>

      <div style={S.tagsWrap}>
        {category.tags.map((tag, i) => (
          <TagRow
            key={tag}
            tag={tag}
            index={i}
            isFirst={i === 0}
            isLast={i === category.tags.length - 1}
            allCategories={allCategories}
            onRemove={() => onRemoveTag(tag)}
            onRename={(newTag) => onRenameTag(tag, newTag)}
            onMoveUp={() => onMoveTagInCategory(tag, -1)}
            onMoveDown={() => onMoveTagInCategory(tag, 1)}
          />
        ))}
      </div>

      <div style={S.addRow}>
        <input
          style={S.tagInput}
          value={tagDraft}
          onChange={(e) => setTagDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          placeholder="新增標籤"
        />
        <button type="button" style={S.addTagBtn} onClick={addTag}>加入</button>
      </div>

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
  );
}

export default function ManageTags({ categories, onRenameCategory, onDeleteCategory, onAddTag, onRemoveTag, onMoveTag, onMoveTagInCategory, onRenameTag, onAddCategory, onMoveCategory, onClose }) {
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
            onRenameTag={onRenameTag ? (tag, newTag) => onRenameTag(cat.id, tag, newTag) : undefined}
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
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitNewCategory(); } }}
            placeholder="新增分類名稱"
          />
          <button type="button" style={S.addCategoryBtn} onClick={submitNewCategory}>新增分類</button>
        </div>
      </div>
    </div>
  );
}
