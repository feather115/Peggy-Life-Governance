// 新增 / 編輯「紀錄」的表單（事件與日記合併後的單一表單）。record = null 為新增模式。
// 一份表單分兩區：計畫（標題/顏色/選項庫標籤/備註）與回顧（今天的感覺/＃注記/分類標籤）。
// 回顧區可收合——過去的紀錄或已經有回顧內容時預設展開，未來的計畫預設收起（「行程過了再補心情」）。
// allRecords：目前所有紀錄（給標題自動完成建議用，只在新增模式才出現）。
// 動作列：確認按鈕固定在頂部 header，返回鍵在有未儲存變更時會先確認。
import React, { useMemo, useState } from 'react';
import { fromDatetimeLocalValue, toDatetimeLocalValue } from '../utils.js';
import { EVENT_COLORS, THEME } from '../theme.js';
import TimeSelect from './TimeSelect.jsx';
import { PeopleSelect } from './HistoryFields.jsx';

const S = {
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: THEME.surface, borderBottom: `1px solid ${THEME.border}` },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  backBtn: { border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: THEME.textMuted, padding: '2px 6px', outline: 'none' },
  title: { fontSize: 17, fontWeight: 700, color: THEME.textDark, margin: 0 },
  confirmBtn: { border: 'none', cursor: 'pointer', padding: '9px 18px', borderRadius: 999, background: THEME.primary, color: '#fff', fontSize: 14, fontWeight: 700, outline: 'none', boxShadow: '0 4px 12px rgba(61,90,128,.28)' },
  body: { padding: '18px 20px 24px' },
  field: { marginBottom: 18 },
  label: { fontSize: 13, color: THEME.textMuted, marginBottom: 6 },
  input: { width: '100%', boxSizing: 'border-box', border: `1px solid ${THEME.border}`, borderRadius: THEME.radiusSm, padding: '11px 12px', fontSize: 15, color: THEME.textDark, background: THEME.surface, outline: 'none' },
  textarea: { width: '100%', boxSizing: 'border-box', border: `1px solid ${THEME.border}`, borderRadius: THEME.radiusSm, padding: '11px 12px', fontSize: 15, color: THEME.textDark, background: THEME.surface, outline: 'none', minHeight: 76, lineHeight: 1.6, fontFamily: 'inherit', resize: 'vertical' },
  suggestions: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  suggestionChip: { cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, background: THEME.surfaceAlt, padding: '5px 10px 5px 8px', borderRadius: 999, fontSize: 12, color: THEME.textDark },
  suggestionDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  colorsRow: { display: 'flex', gap: 8 },
  colorDot: (selected) => ({ cursor: 'pointer', width: 28, height: 28, borderRadius: '50%', border: selected ? `2px solid ${THEME.textDark}` : '2px solid transparent' }),
  toggleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  toggleLabel: { fontSize: 14, color: THEME.textDark, fontWeight: 600 },
  toggleTrack: (on) => ({ width: 44, height: 26, borderRadius: 13, background: on ? THEME.primary : THEME.textFaint, position: 'relative', cursor: 'pointer' }),
  toggleKnob: (on) => ({ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: on ? 21 : 3, boxShadow: '0 1px 3px rgba(0,0,0,.25)' }),
  endRow: { display: 'flex', gap: 8 },
  dateTimeRow: { display: 'flex', gap: 8 },
  dateInput: { flex: 3, boxSizing: 'border-box', border: `1px solid ${THEME.border}`, borderRadius: THEME.radiusSm, padding: '11px 12px', fontSize: 15, color: THEME.textDark, background: THEME.surface, outline: 'none' },
  timeInputWrap: { flex: 2 },
  clearBtn: { border: `1px solid ${THEME.border}`, background: THEME.surface, cursor: 'pointer', padding: '0 14px', borderRadius: THEME.radiusSm, fontSize: 13, color: THEME.textMuted, fontWeight: 600 },
  errorBox: { background: THEME.errorBg, color: THEME.error, padding: '10px 12px', borderRadius: THEME.radiusSm, fontSize: 13, fontWeight: 600, marginBottom: 12 },
  deleteLink: (confirming) => ({ marginTop: 24, textAlign: 'center', fontSize: 13, fontWeight: 600, color: confirming ? THEME.error : THEME.textMuted, cursor: 'pointer' }),
  // 分區標頭
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 14px', fontSize: 13, fontWeight: 700, color: THEME.textMuted, letterSpacing: '0.04em' },
  sectionRule: { flex: 1, height: 1, background: THEME.border },
  reflectToggle: { width: '100%', boxSizing: 'border-box', border: `1px dashed ${THEME.primary}`, background: THEME.surface, color: THEME.primary, cursor: 'pointer', padding: 12, borderRadius: THEME.radiusSm, fontSize: 14, fontWeight: 700, outline: 'none', marginBottom: 4 },
  // ＃快速注記
  hashtagLabel: { fontSize: 13, fontWeight: 700, color: THEME.textMuted, margin: '12px 0 8px' },
  hashtagChips: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  hashtagChip: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: THEME.hashtagInk, background: THEME.hashtagBg, padding: '4px 10px', borderRadius: 999 },
  hashtagRemove: { cursor: 'pointer', fontSize: 14, lineHeight: 1, opacity: 0.6 },
  hashtagRow: { display: 'flex', gap: 8 },
  hashtagAddBtn: { border: 'none', cursor: 'pointer', padding: '0 16px', borderRadius: THEME.radiusSm, background: THEME.hashtagBg, color: THEME.hashtagInk, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 },
  // 分類標籤卡
  categoryList: { display: 'flex', flexDirection: 'column', gap: 16 },
  categoryCard: { background: THEME.surface, borderRadius: THEME.radius, padding: '16px 18px', boxShadow: THEME.shadow },
  categoryHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  categoryName: { fontSize: 13, fontWeight: 700, color: THEME.textMuted },
  tagWrap: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  tagChip: (selected) => ({ cursor: 'pointer', padding: '9px 15px', borderRadius: 999, background: selected ? THEME.primary : THEME.surfaceAlt, color: selected ? '#fff' : THEME.textDark, fontSize: 13, fontWeight: selected ? 700 : 500, boxShadow: selected ? '0 4px 10px rgba(61,90,128,.28)' : 'none' }),
  subTagChip: (selected) => ({ cursor: 'pointer', padding: '8px 13px', borderRadius: 999, background: selected ? THEME.primary : 'transparent', border: `1px solid ${selected ? THEME.primary : THEME.border}`, color: selected ? '#fff' : THEME.textMuted, fontSize: 12, fontWeight: selected ? 700 : 500, boxShadow: selected ? '0 4px 10px rgba(61,90,128,.28)' : 'none' }),
  addTagIconBtn: { flexShrink: 0, border: 'none', cursor: 'pointer', width: 22, height: 22, borderRadius: '50%', background: THEME.surfaceAlt, color: THEME.textMuted, fontSize: 14, fontWeight: 700, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
  addTagRow: { display: 'flex', gap: 8, marginTop: 10 },
  addTagInput: { flex: 1, boxSizing: 'border-box', border: `1px dashed ${THEME.textFaint}`, background: 'transparent', borderRadius: 999, padding: '8px 14px', fontSize: 13, color: THEME.textDark, outline: 'none' },
  addTagBtn: { border: 'none', cursor: 'pointer', padding: '0 16px', borderRadius: 999, background: THEME.primarySoft, color: THEME.primary, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 },
  addTagHint: { fontSize: 11, color: THEME.textFaint, marginTop: 6 },
  emptyCategory: { fontSize: 12, color: THEME.textFaint },
  detailList: { display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 },
  detailRow: { display: 'flex', alignItems: 'center', gap: 8 },
  detailTagLabel: { flexShrink: 0, fontSize: 12, fontWeight: 700, color: THEME.primary, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  detailInputWrap: { flex: 1, minWidth: 0 },
  detailInput: { width: '100%', minWidth: 0, boxSizing: 'border-box', border: 'none', borderBottom: `1px dashed ${THEME.textFaint}`, background: 'transparent', padding: '3px 2px', fontSize: 12, color: THEME.textDark, outline: 'none' },
  detailSuggestions: { display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 },
  detailSuggestionChip: { border: `1px dashed ${THEME.border}`, background: THEME.surfaceAlt, cursor: 'pointer', padding: '4px 9px', borderRadius: 999, fontSize: 11, color: THEME.textDark },
};

// 新增紀錄時預設開始時間：選定日期的早上 9 點
function defaultStartValue(dateKey) {
  const d = dateKey ? new Date(dateKey) : new Date();
  d.setHours(9, 0, 0, 0);
  return toDatetimeLocalValue(d.toISOString());
}

function DetailInput({ value, history, onChange }) {
  const [focused, setFocused] = useState(false);
  const query = value.trim();
  const suggestions = history.filter((item) => !query || item.includes(query)).slice(0, 5);

  return (
    <div style={S.detailInputWrap}>
      <input
        type="text"
        style={S.detailInput}
        value={value}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value)}
        placeholder="細節（選填）"
      />
      {focused && suggestions.length > 0 && (
        <div style={S.detailSuggestions}>
          {suggestions.map((item) => (
            <button
              key={item}
              type="button"
              style={S.detailSuggestionChip}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onChange(item)}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// 一張分類卡片：分類名稱 + 右上角小「+」新增標籤按鈕 + 標籤 chip 清單（貼在 diary_tags）。
function CategoryTagCard({ category, allCategories, selectedTags, onToggleTag, onAddTag, onSelectTag, tagDetails, onSetTagDetail, tagDetailHistory }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [hint, setHint] = useState('');

  const categoryTagNames = category.tags.flatMap((t) => [t.name, ...t.subs]);

  const submit = async () => {
    const val = draft.trim();
    if (!val) { setAdding(false); return; }
    if (categoryTagNames.includes(val)) {
      onSelectTag(val);
      setDraft(''); setAdding(false);
      return;
    }
    const owner = allCategories.find((c) => c.id !== category.id && c.tags.some((t) => t.name === val || t.subs.includes(val)));
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
            <React.Fragment key={tag.name}>
              <div style={S.tagChip(selectedTags.includes(tag.name))} onClick={() => onToggleTag(tag.name)}>{tag.name}</div>
              {tag.subs.map((sub) => (
                <div key={sub} style={S.subTagChip(selectedTags.includes(sub))} onClick={() => onToggleTag(sub)}>└ {sub}</div>
              ))}
            </React.Fragment>
          ))}
        </div>
      )}
      {category.tags.length === 0 && <div style={S.emptyCategory}>這個分類還沒有標籤</div>}

      {categoryTagNames.some((t) => selectedTags.includes(t)) && (
        <div style={S.detailList}>
          {categoryTagNames.filter((t) => selectedTags.includes(t)).map((tag) => {
            const history = tagDetailHistory?.get(tag) || [];
            return (
              <div key={tag} style={S.detailRow}>
                <span style={S.detailTagLabel}>{tag}</span>
                <DetailInput
                  value={tagDetails[tag] || ''}
                  history={history}
                  onChange={(value) => onSetTagDetail(tag, value)}
                />
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
            onKeyDown={(e) => { if (e.nativeEvent.isComposing) return; if (e.key === 'Enter') { e.preventDefault(); submit(); } if (e.key === 'Escape') setAdding(false); }}
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

export default function RecordForm({ record, defaultDateKey, allRecords = [], categories = [], locationHistory = [], peopleHistory = [], tagOptions = [], onSave, onDelete, onCancel, onAddTag, tagDetailHistory }) {
  const isEdit = !!record;

  // 計畫面
  const [title, setTitle] = useState(record?.title || '');
  const [color, setColor] = useState(record?.color || EVENT_COLORS[0]);
  const [tags, setTags] = useState(record?.tags || []);
  const [description, setDescription] = useState(record?.description || '');
  const [locations, setLocations] = useState(record?.locations || []);
  const [people, setPeople] = useState(record?.people || []);
  const [allDay, setAllDay] = useState(!!record?.all_day);
  const [startValue, setStartValue] = useState(
    record ? toDatetimeLocalValue(record.start_at) : defaultStartValue(defaultDateKey),
  );
  const [endValue, setEndValue] = useState(record?.end_at ? toDatetimeLocalValue(record.end_at) : '');

  // 回顧面
  const [note, setNote] = useState(record?.note || '');
  const [hashtags, setHashtags] = useState(record?.hashtags || []);
  const [hashtagDraft, setHashtagDraft] = useState('');
  const [diaryTags, setDiaryTags] = useState(record?.diary_tags || []);
  const [tagDetails, setTagDetails] = useState(record?.tag_details || {});

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [titleTouched, setTitleTouched] = useState(false);

  // 回顧區是否展開：已經有回顧內容、或這筆的開始時間在現在之前（過期＝可回顧）時預設展開
  const hasReflection = !!(record?.note || (record?.hashtags || []).length || (record?.diary_tags || []).length);
  const isPast = record ? new Date(record.start_at) < new Date() : false;
  const [showReflection, setShowReflection] = useState(hasReflection || isPast);

  // 未儲存變更防呆：記住第一次 render 的欄位快照，按返回時有差異就先問一聲
  const snapshot = JSON.stringify({ title, color, tags, description, locations, people, allDay, startValue, endValue, note, hashtags, diaryTags, tagDetails });
  const [initialSnapshot] = useState(snapshot);
  const handleCancel = () => {
    if (snapshot !== initialSnapshot && !window.confirm('內容還沒儲存，確定要離開嗎？')) return;
    onCancel();
  };

  // 過去用過的標題（新增模式才顯示，輸入時比對片段），點了直接帶入標題 + 顏色
  const titleSuggestions = useMemo(() => {
    if (isEdit) return [];
    const query = title.trim().toLowerCase();
    if (!query) return [];
    const seen = new Map();
    allRecords.forEach((r) => {
      const t = r.title;
      if (!t || t.toLowerCase() === query) return;
      if (!t.toLowerCase().includes(query)) return;
      if (!seen.has(t)) seen.set(t, r);
    });
    return Array.from(seen.entries()).slice(0, 5);
  }, [allRecords, title, isEdit]);

  const toggleAllDay = () => {
    const nowAllDay = !allDay;
    setAllDay(nowAllDay);
    if (nowAllDay) {
      if (startValue.length > 10) setStartValue(startValue.slice(0, 10));
      if (endValue.length > 10) setEndValue(endValue.slice(0, 10));
    } else {
      if (startValue.length === 10) setStartValue(`${startValue}T09:00`);
      if (endValue.length === 10) setEndValue(`${endValue}T09:00`);
    }
  };

  const toggleDiaryTag = (tag) => {
    setDiaryTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
    setTagDetails((prev) => {
      if (!(tag in prev)) return prev;
      const next = { ...prev };
      delete next[tag];
      return next;
    });
  };
  const selectDiaryTag = (tag) => setDiaryTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
  const setTagDetail = (tag, detail) => setTagDetails((prev) => ({ ...prev, [tag]: detail }));

  // ＃前綴由系統加，輸入時打字就好；重複的不再加
  const addHashtag = () => {
    const h = hashtagDraft.trim().replace(/^[#＃]+/, '');
    setHashtagDraft('');
    if (h && !hashtags.includes(h)) setHashtags([...hashtags, h]);
  };

  const handleSave = async () => {
    setError('');
    setTitleTouched(true);
    if (!startValue) { setError('請選擇時間'); return; }

    // 只留下目前有選中、而且真的有填細節的分類標籤
    const cleanedTagDetails = {};
    diaryTags.forEach((tag) => {
      const detail = (tagDetails[tag] || '').trim();
      if (detail) cleanedTagDetails[tag] = detail;
    });

    const payload = {
      title: title.trim() || null,
      description: description.trim() || null,
      note: note.trim() || null,
      color,
      all_day: allDay,
      start_at: fromDatetimeLocalValue(allDay ? `${startValue.slice(0, 10)}T00:00` : startValue),
      end_at: endValue ? fromDatetimeLocalValue(allDay ? `${endValue.slice(0, 10)}T00:00` : endValue) : null,
      locations,
      people,
      tags,
      diary_tags: diaryTags,
      tag_details: cleanedTagDetails,
      hashtags,
    };

    setBusy(true);
    try {
      await onSave(payload, record?.id);
    } catch (e) {
      setError(e.message || '儲存失敗');
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setBusy(true);
    try {
      await onDelete(record.id);
    } catch (e) {
      setError(e.message || '刪除失敗');
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div>
      <header style={S.header}>
        <div style={S.headerLeft}>
          <button type="button" onClick={handleCancel} disabled={busy} style={S.backBtn} aria-label="返回">←</button>
          <h1 style={S.title}>{isEdit ? '編輯紀錄' : '新增紀錄'}</h1>
        </div>
        <button type="button" onClick={handleSave} disabled={busy} style={S.confirmBtn}>{busy ? '儲存中…' : '儲存'}</button>
      </header>

      <div style={S.body}>
        {error && <div style={S.errorBox}>{error}</div>}

        {/* ---- 時間 ---- */}
        <div style={S.toggleRow}>
          <div style={S.toggleLabel}>全天</div>
          <div style={S.toggleTrack(allDay)} onClick={toggleAllDay}>
            <div style={S.toggleKnob(allDay)} />
          </div>
        </div>

        <div style={S.field}>
          <div style={S.label}>開始時間</div>
          {allDay ? (
            <input type="date" style={S.input} value={startValue.slice(0, 10)} onChange={(e) => setStartValue(e.target.value)} />
          ) : (
            <div style={S.dateTimeRow}>
              <input type="date" style={S.dateInput} value={startValue.slice(0, 10)} onChange={(e) => setStartValue(`${e.target.value}T${startValue.slice(11, 16)}`)} />
              <div style={S.timeInputWrap}>
                <TimeSelect value={startValue.slice(11, 16)} onChange={(t) => setStartValue(`${startValue.slice(0, 10)}T${t}`)} />
              </div>
            </div>
          )}
        </div>

        <div style={S.field}>
          <div style={S.label}>結束時間 <span style={{ color: THEME.textFaint }}>(選填)</span></div>
          {allDay ? (
            <div style={S.endRow}>
              <input type="date" style={S.input} value={endValue.slice(0, 10)} onChange={(e) => setEndValue(e.target.value)} />
              {endValue && <button type="button" style={S.clearBtn} onClick={() => setEndValue('')}>清除</button>}
            </div>
          ) : (
            <div style={S.dateTimeRow}>
              <input type="date" style={S.dateInput} value={endValue.slice(0, 10)} onChange={(e) => setEndValue(`${e.target.value}T${endValue.slice(11, 16) || '09:00'}`)} />
              <div style={S.timeInputWrap}>
                <TimeSelect value={endValue.slice(11, 16)} onChange={(t) => setEndValue(`${endValue.slice(0, 10) || startValue.slice(0, 10)}T${t}`)} />
              </div>
              {endValue && <button type="button" style={S.clearBtn} onClick={() => setEndValue('')}>清除</button>}
            </div>
          )}
        </div>

        <div style={S.field}>
          <div style={S.label}>地點 <span style={{ color: THEME.textFaint }}>(選填)</span></div>
          <PeopleSelect people={locations} onChange={setLocations} history={locationHistory} addPlaceholder="輸入地點後按 Enter" />
        </div>

        <div style={S.field}>
          <div style={S.label}>和誰 <span style={{ color: THEME.textFaint }}>(選填)</span></div>
          <PeopleSelect people={people} onChange={setPeople} history={peopleHistory} />
        </div>

        {/* ---- 計畫面 ---- */}
        <div style={S.sectionHeader}><span>計畫</span><span style={S.sectionRule} /></div>

        <div style={S.field}>
          <div style={S.label}>標題 <span style={{ color: THEME.textFaint }}>(選填)</span></div>
          <input style={S.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：牙醫回診" />
          {titleSuggestions.length > 0 && (
            <div style={S.suggestions}>
              {titleSuggestions.map(([t, r]) => (
                <div key={t} style={S.suggestionChip} onClick={() => { setTitle(t); setColor(r.color || EVENT_COLORS[0]); }}>
                  <span style={{ ...S.suggestionDot, background: r.color || THEME.primary }} />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={S.field}>
          <div style={S.label}>顏色</div>
          <div style={S.colorsRow}>
            {EVENT_COLORS.map((c) => (
              <div key={c} style={{ ...S.colorDot(color === c), background: c }} onClick={() => setColor(c)} />
            ))}
          </div>
        </div>

        <div style={S.field}>
          <div style={S.label}>標籤 <span style={{ color: THEME.textFaint }}>(選填)</span></div>
          <PeopleSelect people={tags} onChange={setTags} history={tagOptions} addPlaceholder="輸入標籤後按 Enter" />
        </div>

        <div style={S.field}>
          <div style={S.label}>備註 <span style={{ color: THEME.textFaint }}>(選填)</span></div>
          <textarea style={S.textarea} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="備註…" />
        </div>

        {/* ---- 回顧面（可收合）---- */}
        {!showReflection ? (
          <button type="button" style={S.reflectToggle} onClick={() => setShowReflection(true)}>＋ 補上心情 / 回顧</button>
        ) : (
          <>
            <div style={S.sectionHeader}><span>回顧 · 心情</span><span style={S.sectionRule} /></div>

            <div style={S.field}>
              <div style={S.label}>今天的感覺 <span style={{ color: THEME.textFaint }}>(選填)</span></div>
              <textarea style={S.textarea} value={note} onChange={(e) => setNote(e.target.value)} placeholder="寫下今天的一些想法…" />
              <div style={S.hashtagLabel}>＃ 快速注記</div>
              {hashtags.length > 0 && (
                <div style={S.hashtagChips}>
                  {hashtags.map((h) => (
                    <span key={h} style={S.hashtagChip}>
                      ＃{h}
                      <span style={S.hashtagRemove} onClick={() => setHashtags(hashtags.filter((x) => x !== h))}>×</span>
                    </span>
                  ))}
                </div>
              )}
              <div style={S.hashtagRow}>
                <input
                  type="text"
                  style={S.input}
                  value={hashtagDraft}
                  onChange={(e) => setHashtagDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.nativeEvent.isComposing) return; if (e.key === 'Enter') { e.preventDefault(); addHashtag(); } if (e.key === 'Escape') setHashtagDraft(''); }}
                  placeholder="輸入短句後按 Enter，例如：今天吃好多"
                />
                <button type="button" style={S.hashtagAddBtn} onMouseDown={(e) => e.preventDefault()} onClick={addHashtag}>加入</button>
              </div>
            </div>

            <div style={S.categoryList}>
              {categories.map((cat) => (
                <CategoryTagCard
                  key={cat.id}
                  category={cat}
                  allCategories={categories}
                  selectedTags={diaryTags}
                  onToggleTag={toggleDiaryTag}
                  onAddTag={onAddTag}
                  onSelectTag={selectDiaryTag}
                  tagDetails={tagDetails}
                  onSetTagDetail={setTagDetail}
                  tagDetailHistory={tagDetailHistory}
                />
              ))}
            </div>
          </>
        )}

        {isEdit && onDelete && (
          <div style={S.deleteLink(confirmDelete)} onClick={busy ? undefined : handleDelete}>
            {confirmDelete ? '確定要刪除嗎？' : '刪除紀錄'}
          </div>
        )}
      </div>
    </div>
  );
}
