// 新增 / 編輯單筆日記。entry = null 為新增模式。
import React, { useState } from 'react';
import { THEME } from '../theme.js';
import { dayLabel } from '../utils.js';
import TimeSelect from './TimeSelect.jsx';

const S = {
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: THEME.surface, borderBottom: `1px solid ${THEME.border}` },
  backBtn: { border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: THEME.textMuted, padding: '2px 6px', outline: 'none' },
  confirmBtn: { border: 'none', cursor: 'pointer', padding: '9px 18px', borderRadius: 999, background: THEME.primary, color: '#fff', fontSize: 14, fontWeight: 700, outline: 'none', boxShadow: '0 4px 12px rgba(61,90,128,.28)' },
  body: { padding: '24px 20px 40px' },
  heading: { textAlign: 'center', marginBottom: 22 },
  headingEyebrow: { fontSize: 12, letterSpacing: '0.06em', color: THEME.textFaint, fontWeight: 600, marginBottom: 6 },
  headingTitle: { fontSize: 18, fontWeight: 700, color: THEME.textDark },
  selectedChips: { minHeight: 30, display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 20 },
  selectedChip: { fontSize: 12, fontWeight: 700, color: '#fff', background: THEME.primary, padding: '5px 12px', borderRadius: 999 },
  noSelection: { fontSize: 13, color: THEME.textFaint },
  toggleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  toggleLabel: { fontSize: 14, color: THEME.textDark, fontWeight: 600 },
  toggleTrack: (on) => ({ width: 44, height: 26, borderRadius: 13, background: on ? THEME.primary : THEME.textFaint, position: 'relative', cursor: 'pointer' }),
  toggleKnob: (on) => ({ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: on ? 21 : 3, boxShadow: '0 1px 3px rgba(0,0,0,.25)' }),
  timeRow: { display: 'flex', gap: 12, marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: 700, color: THEME.textMuted, marginBottom: 8 },
  input: { width: '100%', boxSizing: 'border-box', border: `1px solid ${THEME.border}`, borderRadius: THEME.radiusSm, padding: '10px 12px', fontSize: 14, color: THEME.textDark, background: THEME.surface, outline: 'none' },
  endRow: { display: 'flex', gap: 8 },
  clearBtn: { border: `1px solid ${THEME.border}`, background: THEME.surface, cursor: 'pointer', padding: '0 12px', borderRadius: THEME.radiusSm, fontSize: 13, color: THEME.textMuted, fontWeight: 600 },
  field: { marginBottom: 20 },
  historyChips: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  historyChip: (selected) => ({ cursor: 'pointer', padding: '5px 12px', borderRadius: 999, background: selected ? THEME.primary : THEME.surfaceAlt, color: selected ? '#fff' : THEME.textDark, fontSize: 12, fontWeight: selected ? 700 : 500 }),
  textarea: { width: '100%', boxSizing: 'border-box', border: `1px solid ${THEME.border}`, borderRadius: THEME.radiusSm, padding: '12px 14px', fontSize: 14, lineHeight: 1.6, color: THEME.textDark, background: THEME.surface, outline: 'none', fontFamily: 'inherit', resize: 'vertical' },
  categoryList: { display: 'flex', flexDirection: 'column', gap: 16 },
  categoryCard: { background: THEME.surface, borderRadius: THEME.radius, padding: '16px 18px', boxShadow: THEME.shadow },
  categoryHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  categoryName: { fontSize: 13, fontWeight: 700, color: THEME.textMuted },
  tagWrap: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  tagChip: (selected) => ({ cursor: 'pointer', padding: '9px 15px', borderRadius: 999, background: selected ? THEME.primary : THEME.surfaceAlt, color: selected ? '#fff' : THEME.textDark, fontSize: 13, fontWeight: selected ? 700 : 500, boxShadow: selected ? '0 4px 10px rgba(61,90,128,.28)' : 'none' }),
  addTagIconBtn: { flexShrink: 0, border: 'none', cursor: 'pointer', width: 22, height: 22, borderRadius: '50%', background: THEME.surfaceAlt, color: THEME.textMuted, fontSize: 14, fontWeight: 700, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
  addTagRow: { display: 'flex', gap: 8, marginTop: 10 },
  addTagInput: { flex: 1, boxSizing: 'border-box', border: `1px dashed ${THEME.textFaint}`, background: 'transparent', borderRadius: 999, padding: '8px 14px', fontSize: 13, color: THEME.textDark, outline: 'none' },
  addTagBtn: { border: 'none', cursor: 'pointer', padding: '0 16px', borderRadius: 999, background: THEME.primarySoft, color: THEME.primary, fontSize: 13, fontWeight: 700 },
  addTagHint: { fontSize: 11, color: THEME.textFaint, marginTop: 6 },
  emptyCategory: { fontSize: 12, color: THEME.textFaint },
  detailList: { display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 },
  detailRow: { display: 'flex', alignItems: 'center', gap: 8 },
  detailTagLabel: { flexShrink: 0, fontSize: 12, fontWeight: 700, color: THEME.primary, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  detailInput: { flex: 1, minWidth: 0, boxSizing: 'border-box', border: 'none', borderBottom: `1px dashed ${THEME.textFaint}`, background: 'transparent', padding: '3px 2px', fontSize: 12, color: THEME.textDark, outline: 'none' },
  deleteLink: (confirming) => ({ marginTop: 24, textAlign: 'center', fontSize: 13, fontWeight: 600, color: confirming ? THEME.error : THEME.textMuted, cursor: 'pointer' }),
  errorBox: { background: THEME.errorBg, color: THEME.error, padding: '10px 12px', borderRadius: THEME.radiusSm, fontSize: 13, fontWeight: 600, marginBottom: 16 },
};

// 一張分類卡片：分類名稱 + 右上角小「+」新增標籤按鈕 + 標籤 chip 清單。
// 「+」點開變成輸入框，Enter/按鈕送出。如果輸入的名字在別的分類已經存在，不會建立
// 重複標籤，直接把既有的那個標籤選起來就好（這裡只是要選一個標籤來用，不是在管分類
// ——真的要把標籤搬到別的分類，去設定頁的「管理分類與標籤」，那邊才有處理重複標籤的
// 完整流程）。
function CategoryTagCard({ category, allCategories, selectedTags, onToggleTag, onAddTag, onSelectTag, tagDetails, onSetTagDetail, tagDetailHistory }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [hint, setHint] = useState('');

  const submit = async () => {
    const val = draft.trim();
    if (!val) { setAdding(false); return; }
    if (category.tags.includes(val)) {
      onSelectTag(val);
      setDraft(''); setAdding(false);
      return;
    }
    const owner = allCategories.find((c) => c.id !== category.id && c.tags.includes(val));
    if (owner) {
      onSelectTag(val);
      setHint(`「${val}」已經在「${owner.name}」分類，直接幫你選起來了`);
      setDraft(''); setAdding(false);
      return;
    }
    await onAddTag(category.id, val);
    onSelectTag(val);
    setDraft(''); setAdding(false);
  };

  return (
    <div style={S.categoryCard}>
      <div style={S.categoryHeader}>
        <div style={S.categoryName}>{category.name}</div>
        <button type="button" style={S.addTagIconBtn} onClick={() => { setAdding(true); setHint(''); }} aria-label="新增標籤">＋</button>
      </div>

      {category.tags.length > 0 && (
        <div style={S.tagWrap}>
          {category.tags.map((tag) => (
            <div key={tag} style={S.tagChip(selectedTags.includes(tag))} onClick={() => onToggleTag(tag)}>{tag}</div>
          ))}
        </div>
      )}
      {category.tags.length === 0 && <div style={S.emptyCategory}>這個分類還沒有標籤</div>}

      {/* 選中的標籤（屬於這個分類的）在這裡填細節，緊接在標籤下方，不用跑去別的地方找 */}
      {category.tags.some((t) => selectedTags.includes(t)) && (
        <div style={S.detailList}>
          {category.tags.filter((t) => selectedTags.includes(t)).map((tag) => {
            const historyId = `tagdetail-${encodeURIComponent(tag)}`;
            const history = tagDetailHistory?.get(tag) || [];
            return (
              <div key={tag} style={S.detailRow}>
                <span style={S.detailTagLabel}>{tag}</span>
                <input
                  type="text"
                  style={S.detailInput}
                  value={tagDetails[tag] || ''}
                  onChange={(e) => onSetTagDetail(tag, e.target.value)}
                  placeholder="細節（選填）"
                  list={history.length > 0 ? historyId : undefined}
                />
                {history.length > 0 && (
                  <datalist id={historyId}>
                    {history.map((h) => <option key={h} value={h} />)}
                  </datalist>
                )}
              </div>
            );
          })}
        </div>
      )}

      {adding && (
        <div style={S.addTagRow}>
          <input
            autoFocus
            style={S.addTagInput}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } if (e.key === 'Escape') setAdding(false); }}
            onBlur={submit}
            placeholder="輸入新標籤名稱"
          />
          <button type="button" style={S.addTagBtn} onMouseDown={(e) => e.preventDefault()} onClick={submit}>加入</button>
        </div>
      )}
      {hint && <div style={S.addTagHint}>{hint}</div>}
    </div>
  );
}

export default function DiaryForm({ entry, dateKey, categories, locationHistory = [], peopleHistory = [], onSave, onDelete, onCancel, onAddTag, tagDetailHistory }) {
  const isEdit = !!entry;

  const [allDay, setAllDay] = useState(!!entry?.all_day);
  const [time, setTime] = useState(entry?.time || (() => {
    const now = new Date();
    const roundedMinutes = now.getMinutes() < 30 ? 0 : 30;
    return `${String(now.getHours()).padStart(2, '0')}:${String(roundedMinutes).padStart(2, '0')}`;
  })());
  const [endTime, setEndTime] = useState(entry?.end_time || '');
  const [location, setLocation] = useState(entry?.location || '');
  const [peopleText, setPeopleText] = useState((entry?.people || []).join('、'));
  const [note, setNote] = useState(entry?.note || '');
  const [tags, setTags] = useState(entry?.tags || []);
  const [tagDetails, setTagDetails] = useState(entry?.tag_details || {});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // 未儲存變更防呆：記住第一次 render 的欄位快照，按返回時有差異就先問一聲
  const snapshot = JSON.stringify({ allDay, time, endTime, location, peopleText, note, tags, tagDetails });
  const [initialSnapshot] = useState(snapshot);
  const handleCancel = () => {
    if (snapshot !== initialSnapshot && !window.confirm('內容還沒儲存，確定要離開嗎？')) return;
    onCancel();
  };

  // 「和誰」目前已填的人（跟儲存時同一套切法），點歷史 chip 可切換加入/移除
  const peopleList = peopleText.split(/[,、]/).map((p) => p.trim()).filter(Boolean);
  const togglePerson = (name) => {
    const next = peopleList.includes(name) ? peopleList.filter((p) => p !== name) : [...peopleList, name];
    setPeopleText(next.join('、'));
  };

  const selectTag = (tag) => {
    setTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
  };

  const toggleTag = (tag) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
    setTagDetails((prev) => {
      if (!(tag in prev)) return prev;
      const next = { ...prev };
      delete next[tag];
      return next;
    });
  };

  const setTagDetail = (tag, detail) => {
    setTagDetails((prev) => ({ ...prev, [tag]: detail }));
  };

  const handleSave = async () => {
    setError('');
    const people = peopleText.split(/[,、]/).map((p) => p.trim()).filter(Boolean);
    // 只留下目前有選中、而且真的有填細節的標籤
    const cleanedTagDetails = {};
    tags.forEach((tag) => {
      const detail = (tagDetails[tag] || '').trim();
      if (detail) cleanedTagDetails[tag] = detail;
    });
    const payload = {
      entry_date: dateKey,
      all_day: allDay,
      time: allDay ? null : (time || null),
      end_time: allDay ? null : (endTime || null),
      location: location.trim() || null,
      people,
      tags,
      tag_details: cleanedTagDetails,
      note: note.trim() || null,
    };
    setBusy(true);
    try {
      await onSave(payload, entry?.id);
    } catch (e) {
      setError(e.message || '儲存失敗');
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setBusy(true);
    try {
      await onDelete(entry.id);
    } catch (e) {
      setError(e.message || '刪除失敗');
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  const label = dayLabel(dateKey);

  return (
    <div>
      <div style={S.header}>
        <button type="button" onClick={handleCancel} disabled={busy} style={S.backBtn} aria-label="返回">←</button>
        <button type="button" onClick={handleSave} disabled={busy} style={S.confirmBtn}>{busy ? '儲存中…' : '完成記錄'}</button>
      </div>

      <div style={S.body}>
        {error && <div style={S.errorBox}>{error}</div>}

        <div style={S.heading}>
          <div style={S.headingEyebrow}>今日日記</div>
          <div style={S.headingTitle}>{isEdit ? '編輯日記' : `${label} 做了什麼？`}</div>
        </div>

        <div style={S.selectedChips}>
          {tags.length > 0
            ? tags.map((t) => <span key={t} style={S.selectedChip}>{t}</span>)
            : <span style={S.noSelection}>還沒有選擇標籤</span>}
        </div>

        <div style={S.toggleRow}>
          <div style={S.toggleLabel}>全天日記</div>
          <div style={S.toggleTrack(allDay)} onClick={() => setAllDay((v) => !v)}>
            <div style={S.toggleKnob(allDay)} />
          </div>
        </div>

        {!allDay && (
          <div style={S.timeRow}>
            <div style={{ flex: 1 }}>
              <div style={S.fieldLabel}>時間</div>
              <TimeSelect value={time} onChange={setTime} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={S.fieldLabel}>結束時間 <span style={{ color: THEME.textFaint, fontWeight: 500 }}>(選填)</span></div>
              <div style={S.endRow}>
                <TimeSelect value={endTime} onChange={setEndTime} />
                {endTime && <button type="button" style={S.clearBtn} onClick={() => setEndTime('')}>清除</button>}
              </div>
            </div>
          </div>
        )}

        <div style={S.field}>
          <div style={S.fieldLabel}>地點</div>
          <input type="text" style={S.input} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="例如：家裡" />
          {locationHistory.length > 0 && (
            <div style={S.historyChips}>
              {locationHistory.slice(0, 8).map((loc) => (
                <div key={loc} style={S.historyChip(location.trim() === loc)} onClick={() => setLocation(location.trim() === loc ? '' : loc)}>{loc}</div>
              ))}
            </div>
          )}
        </div>

        <div style={S.field}>
          <div style={S.fieldLabel}>和誰在一起</div>
          <input type="text" style={S.input} value={peopleText} onChange={(e) => setPeopleText(e.target.value)} placeholder="例如：阿華、媽媽" />
          {peopleHistory.length > 0 && (
            <div style={S.historyChips}>
              {peopleHistory.slice(0, 8).map((name) => (
                <div key={name} style={S.historyChip(peopleList.includes(name))} onClick={() => togglePerson(name)}>{name}</div>
              ))}
            </div>
          )}
        </div>

        <div style={S.field}>
          <div style={S.fieldLabel}>今天的感覺</div>
          <textarea style={{ ...S.textarea, minHeight: 76 }} value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="寫下今天的一些想法…" />
        </div>

        <div style={S.categoryList}>
          {categories.map((cat) => (
            <CategoryTagCard
              key={cat.id}
              category={cat}
              allCategories={categories}
              selectedTags={tags}
              onToggleTag={toggleTag}
              onAddTag={onAddTag}
              onSelectTag={selectTag}
              tagDetails={tagDetails}
              onSetTagDetail={setTagDetail}
              tagDetailHistory={tagDetailHistory}
            />
          ))}
        </div>

        {isEdit && onDelete && (
          <div style={S.deleteLink(confirmDelete)} onClick={handleDelete}>
            {confirmDelete ? '確定要刪除嗎？' : '刪除這則日記'}
          </div>
        )}
      </div>
    </div>
  );
}
