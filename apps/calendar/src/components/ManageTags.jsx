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
  nameText: { cursor: 'pointer', fontSize: 15, fontWeight: 700, color: THEME.textDark },
  nameEditIcon: { fontSize: 12, color: THEME.textFaint, fontWeight: 500 },
  renameInput: { flex: 1, boxSizing: 'border-box', padding: '6px 10px', borderRadius: 8, border: `1px solid ${THEME.primary}`, fontSize: 15, fontWeight: 700, color: THEME.textDark, background: THEME.surface, outline: 'none' },
  deleteLabel: (confirming) => ({ cursor: 'pointer', fontSize: 12, fontWeight: 600, color: confirming ? THEME.error : THEME.textMuted, whiteSpace: 'nowrap' }),
  tagsWrap: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tagChip: { display: 'flex', alignItems: 'center', gap: 6, background: THEME.surfaceAlt, padding: '7px 6px 7px 12px', borderRadius: 999 },
  tagLabel: { fontSize: 12, color: THEME.textDark, fontWeight: 500 },
  tagRemove: { cursor: 'pointer', width: 18, height: 18, borderRadius: '50%', background: THEME.bg, color: THEME.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 },
  addRow: { display: 'flex', gap: 8 },
  tagInput: { flex: 1, boxSizing: 'border-box', padding: '8px 10px', borderRadius: 8, border: `1px dashed ${THEME.textFaint}`, fontSize: 13, color: THEME.textDark, background: 'transparent', outline: 'none' },
  addTagBtn: { border: 'none', cursor: 'pointer', padding: '0 14px', borderRadius: 8, background: THEME.primarySoft, color: THEME.primary, fontSize: 13, fontWeight: 700 },
  newCategoryCard: { background: THEME.surface, borderRadius: THEME.radius, padding: '16px 18px', boxShadow: THEME.shadow, display: 'flex', gap: 8 },
  newCategoryInput: { flex: 1, boxSizing: 'border-box', padding: '10px 12px', borderRadius: THEME.radiusSm, border: `1px solid ${THEME.border}`, fontSize: 14, color: THEME.textDark, background: THEME.surface, outline: 'none' },
  addCategoryBtn: { border: 'none', cursor: 'pointer', padding: '0 18px', borderRadius: THEME.radiusSm, background: THEME.primary, color: '#fff', fontSize: 14, fontWeight: 700 },
};

function CategoryCard({ category, onRename, onDelete, onAddTag, onRemoveTag }) {
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(category.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tagDraft, setTagDraft] = useState('');

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
    onAddTag(val);
    setTagDraft('');
  };

  return (
    <div style={S.card}>
      <div style={S.cardTop}>
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
        <div style={S.deleteLabel(confirmDelete)} onClick={handleDeleteClick}>
          {confirmDelete ? '確定？' : '刪除分類'}
        </div>
      </div>

      <div style={S.tagsWrap}>
        {category.tags.map((tag) => (
          <div key={tag} style={S.tagChip}>
            <span style={S.tagLabel}>{tag}</span>
            <span style={S.tagRemove} onClick={() => onRemoveTag(tag)}>×</span>
          </div>
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
    </div>
  );
}

export default function ManageTags({ categories, onRenameCategory, onDeleteCategory, onAddTag, onRemoveTag, onAddCategory, onClose }) {
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
        {categories.map((cat) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            onRename={(name) => onRenameCategory(cat.id, name)}
            onDelete={() => onDeleteCategory(cat.id)}
            onAddTag={(tag) => onAddTag(cat.id, tag)}
            onRemoveTag={(tag) => onRemoveTag(cat.id, tag)}
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
