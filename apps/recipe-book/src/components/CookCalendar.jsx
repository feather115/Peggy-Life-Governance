// Calendar tab: records which recipes were cooked on each day.
import React, { useMemo, useState } from 'react';
import {
  DOW,
  dateLabel,
  dateKeyFrom,
  getMonthDays,
  monthLabel,
  parseDateKey,
  todayKey,
} from '../utils.js';

const S = {
  view: { padding: '6px 18px 24px' },
  title: { fontSize: 24, fontWeight: 900, color: '#3D281E', lineHeight: 1.2, margin: 0 },
  status: { fontSize: 13, color: '#E87A24', fontWeight: 700, marginTop: 4, margin: 0 },
  panel: { background: '#fff', borderRadius: 20, padding: 14, boxShadow: '0 6px 18px -12px rgba(232,122,36,.25)', marginBottom: 12 },
  monthBtn: { border: 'none', background: '#FDF7F4', color: '#8E7568', width: 36, height: 36, borderRadius: 14, fontSize: 18, fontWeight: 900, cursor: 'pointer' },
  monthTitle: { fontSize: 18, fontWeight: 900, color: '#3D281E' },
  weekGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginTop: 14 },
  dow: { textAlign: 'center', fontSize: 12, fontWeight: 900, color: '#C5B4AC' },
  dayBtn: {
    minHeight: 58,
    border: '1px solid #F3DFD4',
    background: '#fff',
    borderRadius: 14,
    padding: '7px 5px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    cursor: 'pointer',
  },
  selectedDay: { borderColor: '#E87A24', background: '#FFF3EB' },
  todayDay: { boxShadow: 'inset 0 0 0 2px rgba(232,122,36,.16)' },
  dayNum: { fontSize: 13, fontWeight: 900, color: '#3D281E' },
  count: { minWidth: 18, height: 18, borderRadius: 9, background: '#E87A24', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 },
  tinyTitle: { width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center', fontSize: 10, fontWeight: 800, color: '#8E7568' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginTop: 12 },
  select: { width: '100%', border: 'none', background: '#FDF7F4', borderRadius: 14, padding: '11px 12px', fontSize: 14, fontWeight: 800, color: '#3D281E', outline: 'none' },
  addBtn: { border: 'none', background: '#E87A24', color: '#fff', borderRadius: 14, padding: '0 16px', fontSize: 14, fontWeight: 900, cursor: 'pointer' },
  warning: { background: '#FFF3EB', color: '#B45309', borderRadius: 14, padding: '10px 12px', fontSize: 13, fontWeight: 800, lineHeight: 1.5, marginTop: 12 },
  sectionTitle: { fontSize: 15, fontWeight: 900, color: '#3D281E', marginBottom: 10 },
  recordRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px solid #F3DFD4' },
  recordThumb: { width: 42, height: 42, borderRadius: 12, objectFit: 'cover', background: '#FDF7F4', flexShrink: 0 },
  placeholder: { width: 42, height: 42, borderRadius: 12, background: '#FDF7F4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  removeBtn: { border: 'none', background: '#FDF7F4', color: '#C5B4AC', width: 30, height: 30, borderRadius: 15, fontSize: 18, lineHeight: 1, cursor: 'pointer' },
  empty: { color: '#C5B4AC', fontSize: 14, fontWeight: 700, textAlign: 'center', padding: '18px 4px' },
};

export default function CookCalendar({ recipes, cookRecords, cookRecordError, onAddRecord, onRemoveRecord }) {
  const initialDate = useMemo(() => parseDateKey(todayKey()), []);
  const [visibleMonth, setVisibleMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [selectedRecipeId, setSelectedRecipeId] = useState('');

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
  const selectedRecipeIds = new Set(selectedRecords.map((record) => String(record.recipe_id)));
  const availableRecipes = recipes.filter((recipe) => !selectedRecipeIds.has(String(recipe.id)));

  const shiftMonth = (delta) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  const selectToday = () => {
    const now = parseDateKey(todayKey());
    setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(todayKey());
  };

  const handleAdd = async () => {
    if (!selectedRecipeId) return;
    try {
      await onAddRecord(selectedDate, selectedRecipeId);
      setSelectedRecipeId('');
    } catch {
      // The shared error banner is updated by useRecipes.
    }
  };

  return (
    <div style={S.view}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
        <div>
          <h1 style={S.title}>料理行事曆</h1>
          <p style={S.status}>● 已紀錄 {cookRecords.length} 次料理</p>
        </div>
        <button type="button" onClick={selectToday} style={{ border: 'none', background: '#F0E7E1', color: '#8E7568', fontWeight: 800, fontSize: 13, padding: '8px 14px', borderRadius: 14, cursor: 'pointer' }}>
          今天
        </button>
      </header>

      <section style={S.panel}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button type="button" onClick={() => shiftMonth(-1)} style={S.monthBtn}>‹</button>
          <div style={S.monthTitle}>{monthLabel(visibleMonth.getFullYear(), visibleMonth.getMonth())}</div>
          <button type="button" onClick={() => shiftMonth(1)} style={S.monthBtn}>›</button>
        </div>

        <div style={S.weekGrid}>
          {DOW.map((day) => <div key={day} style={S.dow}>{day}</div>)}
          {monthDays.map((dateKey, index) => {
            if (!dateKey) return <div key={`empty-${index}`} />;
            const date = parseDateKey(dateKey);
            const dayRecords = recordsByDate[dateKey] || [];
            const firstRecipe = dayRecords[0] ? recipeById.get(String(dayRecords[0].recipe_id)) : null;
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
                {firstRecipe && <span style={S.tinyTitle}>{firstRecipe.title}</span>}
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
        <div style={S.formRow}>
          <select
            value={selectedRecipeId}
            onChange={(event) => setSelectedRecipeId(event.target.value)}
            style={S.select}
          >
            <option value="">選擇料理</option>
            {availableRecipes.map((recipe) => (
              <option key={recipe.id} value={recipe.id}>{recipe.title}</option>
            ))}
          </select>
          <button type="button" onClick={handleAdd} disabled={!selectedRecipeId || !!cookRecordError} style={{ ...S.addBtn, opacity: selectedRecipeId && !cookRecordError ? 1 : 0.45 }}>
            加入
          </button>
        </div>

        <div style={{ marginTop: 10 }}>
          {selectedRecords.length === 0 ? (
            <div style={S.empty}>這天還沒有料理紀錄</div>
          ) : selectedRecords.map((record) => {
            const recipe = recipeById.get(String(record.recipe_id));
            return (
              <div key={record.id} style={S.recordRow}>
                {recipe?.image_url
                  ? <img src={recipe.image_url} alt={recipe.title} style={S.recordThumb} />
                  : <div style={S.placeholder}>🍳</div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#3D281E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {recipe?.title || '已刪除的料理'}
                  </div>
                  {recipe?.category?.length > 0 && (
                    <div style={{ fontSize: 12, color: '#8E7568', fontWeight: 800, marginTop: 2 }}>
                      {recipe.category.join('、')}
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => onRemoveRecord(record.id)} style={S.removeBtn} aria-label="刪除料理紀錄">×</button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
