// Calendar tab: records which recipes were cooked on each day.
// 版面跟行事曆 app 的月檢視一致：頁首右側 ‹ › 換月、離開今天時副標旁出現「回到今天」；月曆格子下方的圓點＝那天做了幾道。
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
import { UI } from '@peggy-life/shared/ui';

const S = {
  page: { paddingBottom: 24 },
  backToday: { minHeight: 28, padding: '0 10px', border: 'none', borderRadius: 999, background: 'var(--primary-soft)', color: 'var(--primary-ink)', fontSize: 12, fontWeight: 500 },
  monthCard: { ...UI.card, margin: '8px 20px 0', padding: '12px 8px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', rowGap: 2 },
  dow: { textAlign: 'center', fontSize: 12, fontWeight: 500, color: 'var(--text-faint)', paddingBottom: 6 },
  dayBtn: { height: 50, padding: 0, border: 'none', background: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 },
  dayNum: (isToday, isSelected) => ({
    width: 32, height: 32, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, ...UI.num,
    fontWeight: isToday || isSelected ? 600 : 400,
    background: isToday ? 'var(--primary)' : isSelected ? 'var(--primary-soft)' : 'transparent',
    color: isToday ? 'var(--on-primary)' : isSelected ? 'var(--primary-ink)' : 'var(--text)',
  }),
  dots: { display: 'flex', gap: 3, height: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, background: 'var(--primary-ink)' },
  dayHead: { padding: '14px 16px', borderBottom: '1px solid var(--line)' },
  warning: { ...UI.note('warning'), margin: '12px 16px 0' },
  recordRow: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px' },
  thumbBtn: { flexShrink: 0, padding: 0, border: 'none', background: 'none', borderRadius: 10 },
  thumb: { width: 44, height: 44, borderRadius: 10, objectFit: 'cover', display: 'block', background: 'var(--sunken)' },
  monogram: { width: 44, height: 44, borderRadius: 10, background: 'var(--primary-soft)', color: 'var(--primary-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 500, flexShrink: 0 },
  recordTitle: { display: 'block', maxWidth: '100%', padding: 0, border: 'none', background: 'none', textAlign: 'left', fontSize: 15, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  noteInput: { width: '100%', minHeight: 32, marginTop: 6, padding: '0 10px', border: 'none', borderRadius: 10, background: 'var(--sunken)', color: 'var(--text)', fontSize: 13 },
  removeBtn: { width: 32, height: 32, flex: 'none', padding: 0, border: 'none', borderRadius: 999, background: 'none', color: 'var(--text-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  pickWrap: { borderTop: '1px solid var(--line)', padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 },
  pickList: { display: 'flex', flexDirection: 'column', maxHeight: 220, overflowY: 'auto' },
  pickRow: { ...UI.row, minHeight: 48, padding: '0 4px', justifyContent: 'space-between' },
  more: { fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 },
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

  const today = todayKey();
  const now = parseDateKey(today);
  const onToday = selectedDate === today && visibleMonth.getFullYear() === now.getFullYear() && visibleMonth.getMonth() === now.getMonth();

  return (
    <div style={S.page}>
      <header style={UI.header}>
        <div style={{ minWidth: 0 }}>
          <h1 style={UI.title}>{monthLabel(visibleMonth.getFullYear(), visibleMonth.getMonth())}</h1>
          <p style={UI.subtitle}>
            料理行事曆 · 已紀錄 {cookRecords.length} 次
            {!onToday && <button type="button" className="tap" onClick={selectToday} style={S.backToday}>回到今天</button>}
          </p>
        </div>
        <div style={UI.headerActions}>
          <button type="button" aria-label="上個月" onClick={() => shiftMonth(-1)} style={UI.iconBtn}><Icon name="chevron-left" size={20} /></button>
          <button type="button" aria-label="下個月" onClick={() => shiftMonth(1)} style={UI.iconBtn}><Icon name="chevron-right" size={20} /></button>
        </div>
      </header>

      <section aria-label="月曆" style={S.monthCard}>
        <div style={S.grid}>
          {DOW.map((day) => <div key={day} style={S.dow}>{day}</div>)}
          {monthDays.map((dateKey, index) => {
            if (!dateKey) return <div key={`empty-${index}`} />;
            const date = parseDateKey(dateKey);
            const dayRecords = recordsByDate[dateKey] || [];
            const isSelected = selectedDate === dateKey;
            const isToday = today === dateKey;
            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => setSelectedDate(dateKey)}
                aria-pressed={isSelected}
                aria-label={`${date.getMonth() + 1}月${date.getDate()}日${isToday ? '（今天）' : ''}${dayRecords.length ? `，${dayRecords.length} 道料理` : ''}`}
                style={S.dayBtn}
              >
                <span style={S.dayNum(isToday, isSelected)}>{date.getDate()}</span>
                <span style={S.dots}>
                  {dayRecords.slice(0, 3).map((r) => <span key={r.id} style={S.dot} />)}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section style={UI.section}>
        <div style={UI.listCard}>
          <div style={S.dayHead}>
            <h2 style={UI.sectionTitle}>{dateLabel(selectedDate)} 做了哪些料理</h2>
          </div>
          {cookRecordError && (
            <div style={S.warning}>
              行事曆資料表還沒準備好。請先在 Supabase 執行 recipe-book 的料理紀錄 migration，完成後等約 30 秒再重新整理。
            </div>
          )}

          {/* 1. 當日已做的料理清單 */}
          {selectedRecords.length === 0 ? (
            <div style={UI.empty}>這天還沒有料理紀錄</div>
          ) : selectedRecords.map((record, i) => {
            const recipe = recipeById.get(String(record.recipe_id));
            return (
              <React.Fragment key={record.id}>
                {i > 0 && <div style={UI.divider} />}
                <div style={S.recordRow}>
                  {recipe ? (
                    <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => onOpenRecipe(recipe)} style={S.thumbBtn}>
                      {recipe.image_url
                        ? <img src={recipe.image_url} alt="" style={S.thumb} />
                        : <span style={S.monogram}>{recipe.title?.trim().slice(0, 1)}</span>}
                    </button>
                  ) : (
                    <span aria-hidden="true" style={{ ...S.monogram, background: 'var(--sunken)', color: 'var(--text-faint)' }}><Icon name="utensils" size={18} /></span>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {recipe
                      ? <button type="button" onClick={() => onOpenRecipe(recipe)} style={S.recordTitle}>{recipe.title}</button>
                      : <div style={{ ...S.recordTitle, color: 'var(--text-muted)' }}>已刪除的料理</div>}
                    {recipe?.category?.length > 0 && (
                      <div style={{ ...UI.rowMeta, marginTop: 2 }}>{recipe.category.join('、')}</div>
                    )}
                    <input aria-label="新增備註"
                      type="text"
                      placeholder="新增備註（如：微辣、偏甜）"
                      value={editingNotes[record.id] !== undefined ? editingNotes[record.id] : (record.notes || '')}
                      onChange={(e) => setEditingNotes((prev) => ({ ...prev, [record.id]: e.target.value }))}
                      onBlur={() => handleSaveNotes(record.id, editingNotes[record.id])}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveNotes(record.id, editingNotes[record.id]);
                          e.currentTarget.blur();
                        }
                      }}
                      style={S.noteInput}
                    />
                  </div>
                  <button type="button" className="tap" onClick={() => onRemoveRecord(record.id)} style={S.removeBtn} aria-label="刪除料理紀錄"><Icon name="x" size={18} /></button>
                </div>
              </React.Fragment>
            );
          })}

          {/* 2. 新增料理紀錄 */}
          {!isAdding ? (
            <button type="button" onClick={() => setIsAdding(true)} style={UI.addRow}>
              <Icon name="plus" size={18} />記錄料理
            </button>
          ) : (
            <div style={S.pickWrap}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input aria-label="搜尋料理"
                  type="text"
                  value={recipeQuery}
                  onChange={(e) => setRecipeQuery(e.target.value)}
                  placeholder="輸入關鍵字搜尋料理"
                  style={{ ...UI.input, flex: 1, minWidth: 0 }}
                  autoFocus
                />
                <button type="button" onClick={() => { setIsAdding(false); setRecipeQuery(''); }} style={{ ...UI.btnNeutral, minHeight: 44 }}>收起</button>
              </div>

              {availableRecipes.length > 0 ? (
                <div style={S.pickList}>
                  {availableRecipes.slice(0, 8).map((recipe, i) => (
                    <button
                      key={recipe.id}
                      type="button"
                      onClick={() => handleAddDirectly(recipe.id)}
                      disabled={!!cookRecordError}
                      style={{ ...S.pickRow, borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}
                    >
                      <span style={UI.rowTitle}>{recipe.title}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 500, color: 'var(--primary-ink)', flexShrink: 0 }}><Icon name="plus" size={16} />加入</span>
                    </button>
                  ))}
                  {availableRecipes.length > 8 && (
                    <div style={S.more}>還有 {availableRecipes.length - 8} 道料理，輸入關鍵字以縮小範圍</div>
                  )}
                </div>
              ) : (
                <div style={{ ...UI.empty, padding: '8px 0' }}>沒有可選擇的料理</div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
