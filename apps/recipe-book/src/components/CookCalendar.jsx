// Calendar tab: records which recipes were cooked on each day.
import React, { useEffect, useMemo, useState } from 'react';
import {
  DOW,
  dateLabel,
  dateKeyFrom,
  getMonthDays,
  monthLabel,
  parseDateKey,
  todayKey,
} from '../utils.js';
import Icon from '@peggy-life/shared/Icon.jsx';

const S = {
  view: { padding: '6px 18px 24px' },
  title: { fontSize: 24, fontWeight: 900, color: 'var(--text)', lineHeight: 1.2, margin: 0 },
  status: { fontSize: 13, color: 'var(--primary)', fontWeight: 700, marginTop: 4, margin: 0 },
  panel: { background: 'var(--surface)', borderRadius: 20, padding: 14, boxShadow: 'var(--shadow-card)', marginBottom: 12 },
  monthBtn: { border: 'none', background: 'var(--surface-alt)', color: 'var(--text-muted)', width: 36, height: 36, borderRadius: 14, fontSize: 18, fontWeight: 900, cursor: 'pointer' },
  monthTitle: { fontSize: 18, fontWeight: 900, color: 'var(--text)' },
  weekGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginTop: 14 },
  dow: { textAlign: 'center', fontSize: 12, fontWeight: 900, color: 'var(--text-faint)' },
  dayBtn: {
    minHeight: 58,
    border: '1px solid var(--line)',
    background: 'var(--surface)',
    borderRadius: 14,
    padding: '7px 5px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    cursor: 'pointer',
  },
  selectedDay: { borderColor: 'var(--primary)', background: 'var(--primary-soft)' },
  todayDay: { boxShadow: 'inset 0 0 0 2px rgba(232,122,36,.16)' },
  dayNum: { fontSize: 13, fontWeight: 900, color: 'var(--text)' },
  count: { minWidth: 18, height: 18, borderRadius: 9, background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 },
  tinyTitle: { width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginTop: 12 },
  select: { width: '100%', border: 'none', background: 'var(--surface-alt)', borderRadius: 14, padding: '11px 12px', fontSize: 14, fontWeight: 800, color: 'var(--text)' },
  addBtn: { border: 'none', background: 'var(--primary)', color: '#fff', borderRadius: 14, padding: '0 16px', fontSize: 14, fontWeight: 900, cursor: 'pointer' },
  warning: { background: 'var(--primary-soft)', color: '#B45309', borderRadius: 14, padding: '10px 12px', fontSize: 13, fontWeight: 800, lineHeight: 1.5, marginTop: 12 },
  sectionTitle: { fontSize: 15, fontWeight: 900, color: 'var(--text)', marginBottom: 10 },
  recordRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px solid var(--line)' },
  recordThumb: { width: 42, height: 42, borderRadius: 12, objectFit: 'cover', background: 'var(--surface-alt)', flexShrink: 0 },
  placeholder: { width: 42, height: 42, borderRadius: 12, background: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  removeBtn: { border: 'none', background: 'var(--surface-alt)', color: 'var(--text-faint)', width: 30, height: 30, borderRadius: 15, fontSize: 18, lineHeight: 1, cursor: 'pointer' },
  empty: { color: 'var(--text-faint)', fontSize: 14, fontWeight: 700, textAlign: 'center', padding: '18px 4px' },
  addRecordBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    border: '1px dashed var(--primary)',
    background: 'var(--primary-soft)',
    color: 'var(--primary)',
    borderRadius: 14,
    padding: '12px',
    fontSize: 14,
    fontWeight: 900,
    cursor: 'pointer',
    marginTop: 12,
    boxSizing: 'border-box',
  },
};

export default function CookCalendar({ recipes, cookRecords, cookRecordError, onAddRecord, onRemoveRecord, onUpdateNotes, onOpenRecipe }) {
  const initialDate = useMemo(() => parseDateKey(todayKey()), []);
  const [visibleMonth, setVisibleMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [recipeQuery, setRecipeQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingNotes, setEditingNotes] = useState({});

  const recipeById = useMemo(
    () => new Map(recipes.map((recipe) => [String(recipe.id), recipe])),
    [recipes],
  );
  const recordsByDate = useMemo(() => {
    const map = {};
    cookRecords.forEach((record) => {
      if (!map[record.cooked_date]) map[record.cooked_date] = [];
      map[record.cooked_date].push(record);
    });
    return map;
  }, [cookRecords]);

  const monthDays = useMemo(
    () => getMonthDays(visibleMonth.getFullYear(), visibleMonth.getMonth()),
    [visibleMonth],
  );
  const selectedRecords = recordsByDate[selectedDate] || [];

  const availableRecipes = useMemo(() => {
    const selectedRecipeIds = new Set(selectedRecords.map((record) => String(record.recipe_id)));
    const query = recipeQuery.trim().toLowerCase();

    return recipes
      .filter((recipe) => {
        if (selectedRecipeIds.has(String(recipe.id))) return false;
        if (query) {
          return recipe.title.toLowerCase().includes(query);
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = a.last_cooked_at ? new Date(a.last_cooked_at).getTime() : 0;
        const timeB = b.last_cooked_at ? new Date(b.last_cooked_at).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;

        const updateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const updateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        if (updateA !== updateB) return updateB - updateA;

        const createA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const createB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (createA !== createB) return createB - createA;

        return a.title.localeCompare(b.title, 'zh-Hant');
      });
  }, [recipes, selectedRecords, recipeQuery]);

  const shiftMonth = (delta) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  const selectToday = () => {
    const now = parseDateKey(todayKey());
    setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(todayKey());
  };

  const handleAddDirectly = async (recipeId) => {
    try {
      await onAddRecord(selectedDate, recipeId);
      setRecipeQuery('');
      setIsAdding(false);
    } catch {
      // The shared error banner is updated by useRecipes.
    }
  };

  const handleSaveNotes = async (recordId, notesVal) => {
    const record = cookRecords.find((r) => r.id === recordId);
    if (!record) return;
    const currentNotes = record.notes || '';
    const newNotes = (notesVal || '').trim();
    if (currentNotes === newNotes) return;

    try {
      await onUpdateNotes(recordId, newNotes || null);
    } catch {
      // Handled by useRecipes
    }
  };

  return (
    <div style={S.view}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
        <div>
          <h1 style={S.title}>料理行事曆</h1>
          <p style={S.status}>● 已紀錄 {cookRecords.length} 次料理</p>
        </div>
        <button type="button" onClick={selectToday} style={{ border: 'none', background: 'var(--sunken)', color: 'var(--text-muted)', fontWeight: 800, fontSize: 13, padding: '8px 14px', borderRadius: 14, cursor: 'pointer' }}>
          今天
        </button>
      </header>

      <section style={S.panel}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button aria-label="上個月" className="tap" type="button" onClick={() => shiftMonth(-1)} style={S.monthBtn}><Icon name="chevron-left" size={14} /></button>
          <div style={S.monthTitle}>{monthLabel(visibleMonth.getFullYear(), visibleMonth.getMonth())}</div>
          <button aria-label="下個月" className="tap" type="button" onClick={() => shiftMonth(1)} style={S.monthBtn}><Icon name="chevron-right" size={14} /></button>
        </div>

        <div style={S.weekGrid}>
          {DOW.map((day) => <div key={day} style={S.dow}>{day}</div>)}
          {monthDays.map((dateKey, index) => {
            if (!dateKey) return <div key={`empty-${index}`} />;
            const date = parseDateKey(dateKey);
            const dayRecords = recordsByDate[dateKey] || [];
            const isSelected = selectedDate === dateKey;
            const isToday = todayKey() === dateKey;
            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => setSelectedDate(dateKey)}
                style={{
                  ...S.dayBtn,
                  ...(isSelected ? S.selectedDay : {}),
                  ...(isToday ? S.todayDay : {}),
                }}
              >
                <span style={S.dayNum}>{date.getDate()}</span>
                {dayRecords.length > 0 && <span style={S.count}>{dayRecords.length}</span>}
              </button>
            );
          })}
        </div>
      </section>

      <section style={S.panel}>
        <div style={S.sectionTitle}>{dateLabel(selectedDate)} 做了哪些料理</div>
        {cookRecordError && (
          <div style={S.warning}>
            行事曆資料表還沒準備好。請先在 Supabase 執行 recipe-book 的料理紀錄 migration，完成後等約 30 秒再重新整理。
          </div>
        )}

        {/* 1. 當日已做的料理清單 */}
        <div>
          {selectedRecords.length === 0 ? (
            <div style={S.empty}>這天還沒有料理紀錄</div>
          ) : selectedRecords.map((record) => {
            const recipe = recipeById.get(String(record.recipe_id));
            return (
              <div key={record.id} style={S.recordRow}>
                {recipe ? (
                  <div onClick={() => onOpenRecipe(recipe)} style={{ cursor: 'pointer', flexShrink: 0 }}>
                    {recipe.image_url
                      ? <img src={recipe.image_url} alt={recipe.title} style={S.recordThumb} />
                      : <div style={S.placeholder}>🍳</div>}
                  </div>
                ) : (
                  <div style={S.placeholder}>🍳</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    onClick={() => recipe && onOpenRecipe(recipe)}
                    style={{
                      fontSize: 14,
                      fontWeight: 900,
                      color: 'var(--text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      cursor: recipe ? 'pointer' : 'default',
                    }}
                  >
                    {recipe?.title || '已刪除的料理'}
                  </div>
                  {recipe?.category?.length > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 800, marginTop: 1 }}>
                      {recipe.category.join('、')}
                    </div>
                  )}
                  <div style={{ marginTop: 5 }}>
                    <input aria-label="新增備註"
                      type="text"
                      placeholder="📝 新增備註（如：微辣、偏甜）..."
                      value={editingNotes[record.id] !== undefined ? editingNotes[record.id] : (record.notes || '')}
                      onChange={(e) => setEditingNotes((prev) => ({ ...prev, [record.id]: e.target.value }))}
                      onBlur={() => handleSaveNotes(record.id, editingNotes[record.id])}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveNotes(record.id, editingNotes[record.id]);
                          e.currentTarget.blur();
                        }
                      }}
                      style={{
                        width: '100%',
                        border: 'none',
                        background: 'transparent',
                        borderBottom: '1px dashed var(--text-faint)',
                        padding: '2px 0',
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        fontWeight: 700,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
                <button type="button" onClick={() => onRemoveRecord(record.id)} style={S.removeBtn} aria-label="刪除料理紀錄">×</button>
              </div>
            );
          })}
        </div>

        {/* 2. 新增料理紀錄按鈕與介面 */}
        {!isAdding ? (
          <button type="button" onClick={() => setIsAdding(true)} style={S.addRecordBtn}>
            ＋ 記錄料理
          </button>
        ) : (
          <div style={{ marginTop: 16, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 12 }}>
              <input aria-label="搜尋料理"
                type="text"
                value={recipeQuery}
                onChange={(e) => setRecipeQuery(e.target.value)}
                placeholder="🔍 輸入關鍵字搜尋料理..."
                style={S.select}
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setRecipeQuery('');
                }}
                style={{
                  border: 'none',
                  background: 'var(--sunken)',
                  color: 'var(--text-muted)',
                  borderRadius: 14,
                  padding: '0 16px',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                收起
              </button>
            </div>

            {availableRecipes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto', padding: '2px 0' }}>
                {availableRecipes.slice(0, 8).map((recipe) => (
                  <button
                    key={recipe.id}
                    type="button"
                    onClick={() => handleAddDirectly(recipe.id)}
                    disabled={!!cookRecordError}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      border: 'none',
                      background: 'var(--surface-alt)',
                      borderRadius: 12,
                      padding: '10px 14px',
                      fontSize: 14,
                      fontWeight: 800,
                      color: 'var(--text)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-soft)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-alt)'; }}
                  >
                    <span>{recipe.title}</span>
                    <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 900 }}>＋ 加入</span>
                  </button>
                ))}
                {availableRecipes.length > 8 && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4, fontWeight: 700 }}>
                    還有 {availableRecipes.length - 8} 道料理，輸入關鍵字以縮小範圍
                  </div>
                )}
              </div>
            ) : (
              <div style={S.empty}>沒有可選擇的料理</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
