// Recipe detail view: ingredients, steps, notes, recipe scaling based on base ingredient, and long-press to complete.
import React, { useMemo, useRef, useState } from 'react';
import {
  formatDate,
  groupItemsByType,
  groupStepsByType,
  parseIngredients,
  parseNotes,
  parseSteps,
  parseYieldInfo,
} from '../utils.js';

export default function RecipeDetail({ recipe, onBack }) {
  const [currentWeight, setCurrentWeight] = useState('');
  const [completedItems, setCompletedItems] = useState({});
  const pressTimer = useRef(null);

  const hasParameters = recipe.parameters && typeof recipe.parameters === 'object'
    && Object.keys(recipe.parameters).length > 0;

  const parsedYieldInfo = useMemo(() => parseYieldInfo(recipe.yield_info), [recipe.yield_info]);
  const parsedIngredients = useMemo(() => parseIngredients(recipe.ingredients), [recipe.ingredients]);
  const groupedIngredients = useMemo(() => groupItemsByType(parsedIngredients), [parsedIngredients]);
  const parsedSteps = useMemo(() => parseSteps(recipe.steps), [recipe.steps]);
  const sortedGroupedSteps = useMemo(() => groupStepsByType(parsedSteps), [parsedSteps]);
  const formattedNotes = useMemo(() => parseNotes(recipe.notes), [recipe.notes]);
  const baseIng = useMemo(
    () => parsedIngredients.find((ing) => ing.is_base) || parsedIngredients[0],
    [parsedIngredients],
  );

  const weightNum = currentWeight === '' ? null : Number(currentWeight);
  const isScaled = weightNum !== null && weightNum > 0;

  const scaleRatio = (() => {
    if (!isScaled || !baseIng) return 1;
    const originalNumber = parseFloat(baseIng.amount);
    return originalNumber ? weightNum / originalNumber : 1;
  })();

  function getScaledAmount(ingredient) {
    if (baseIng && ingredient.name === baseIng.name && isScaled) {
      return `${weightNum} g`;
    }
    if (scaleRatio === 1) return ingredient.amount;
    const originalNumber = parseFloat(ingredient.amount);
    if (isNaN(originalNumber)) return ingredient.amount;
    const unit = String(ingredient.amount).includes('ml') ? 'ml' : 'g';
    return `${(originalNumber * scaleRatio).toFixed(1)} ${unit}`;
  }

  function startLongPress(id) {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      setCompletedItems((prev) => ({ ...prev, [id]: !prev[id] }));
    }, 700);
  }
  function endLongPress() {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }
  function pressHandlers(id) {
    return {
      onTouchStart: () => startLongPress(id),
      onTouchEnd: endLongPress,
      onMouseDown: () => startLongPress(id),
      onMouseUp: endLongPress,
    };
  }

  /* ── Inline style objects ── */

  const s = {
    viewDetail: {
      padding: '6px 18px 20px',
    },
    hintBadge: {
      background: '#F6FAF7',
      color: '#6E8B7C',
      padding: '6px 14px',
      borderRadius: 20,
      fontWeight: 800,
      fontSize: 12,
      textAlign: 'center',
      marginBottom: 8,
    },
    cookingCard: {
      background: '#fff',
      borderRadius: 24,
      padding: '20px 18px',
      boxShadow: '0 10px 24px -18px rgba(46,139,94,.5)',
    },
    recipeImage: {
      width: '100%',
      height: 200,
      objectFit: 'cover',
      borderRadius: 16,
      marginBottom: 14,
    },
    badgesRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 8,
    },
    categoryBadge: {
      background: '#2E8B5E',
      color: '#fff',
      padding: '4px 12px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 800,
    },
    yieldBadge: {
      background: '#F6FAF7',
      color: '#6E8B7C',
      padding: '4px 12px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 800,
    },
    titleRow: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: 10,
    },
    chefLogo: {
      width: 28,
      height: 28,
      borderRadius: '50%',
      marginRight: 8,
      verticalAlign: 'middle',
    },
    recipeTitle: {
      fontSize: 22,
      fontWeight: 900,
      color: '#234034',
      margin: 0,
    },
    paramsDashboard: {
      background: '#F6FAF7',
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
    },
    dashboardTitle: {
      fontSize: 13,
      fontWeight: 800,
      color: '#6E8B7C',
      marginBottom: 8,
    },
    dashboardGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8,
    },
    paramKey: {
      fontSize: 12,
      fontWeight: 800,
      color: '#6E8B7C',
    },
    paramValue: {
      fontSize: 16,
      fontWeight: 900,
      color: '#234034',
    },
    scaleController: {
      background: '#F6FAF7',
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
    },
    scaleLabel: {
      fontSize: 13,
      fontWeight: 700,
      color: '#234034',
      marginBottom: 8,
    },
    scaleInputs: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    baseName: {
      fontSize: 14,
      fontWeight: 800,
      color: '#234034',
    },
    weightInput: {
      border: 'none',
      background: '#fff',
      borderRadius: 14,
      padding: '10px 12px',
      fontSize: 16,
      fontWeight: 800,
      color: '#234034',
      width: 80,
      outline: 'none',
    },
    unitText: {
      fontSize: 13,
      color: '#6E8B7C',
      fontWeight: 700,
    },
    resetBtn: {
      background: '#2E8B5E',
      color: '#fff',
      border: 'none',
      borderRadius: 14,
      padding: '8px 14px',
      fontSize: 13,
      fontWeight: 800,
      cursor: 'pointer',
    },
    scaleAlert: {
      background: '#DCFCE7',
      color: '#15803D',
      borderRadius: 12,
      padding: '8px 12px',
      fontSize: 13,
      fontWeight: 700,
      marginTop: 8,
    },
    sectionDivider: {
      fontSize: 15,
      fontWeight: 900,
      color: '#234034',
      marginTop: 20,
      marginBottom: 10,
    },
    ingredientRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 12px',
      background: '#F6FAF7',
      borderRadius: 14,
      marginBottom: 6,
    },
    ingName: {
      fontSize: 14,
      fontWeight: 800,
      color: '#234034',
    },
    ingBrand: {
      fontSize: 11,
      background: '#E8EDFF',
      color: '#4361EE',
      borderRadius: 10,
      padding: '2px 8px',
      marginLeft: 6,
    },
    ingAmount: {
      fontSize: 14,
      fontWeight: 900,
      color: '#2E8B5E',
    },
    completedOverlay: {
      opacity: 0.25,
      textDecoration: 'line-through',
    },
    stepsOl: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
    },
    stepLi: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 10,
    },
    stepNumber: {
      width: 28,
      height: 28,
      borderRadius: '50%',
      background: '#2E8B5E',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 13,
      fontWeight: 800,
      flexShrink: 0,
    },
    stepText: {
      fontSize: 14,
      fontWeight: 700,
      color: '#234034',
      lineHeight: 1.6,
    },
    noteSection: {
      background: '#F6FAF7',
      borderRadius: 16,
      padding: 14,
      border: '1px solid #DCEDE3',
    },
    notesList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
    },
    noteLi: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 8,
      marginBottom: 8,
    },
    notesBullet: {
      color: '#2E8B5E',
      fontWeight: 800,
      flexShrink: 0,
    },
    notesText: {
      margin: 0,
      fontSize: 14,
      fontWeight: 700,
      color: '#234034',
      lineHeight: 1.6,
    },
    lastCooked: {
      fontSize: 12,
      color: '#9bb0a3',
      fontWeight: 700,
      textAlign: 'center',
      marginTop: 16,
    },
  };

  return (
    <div style={s.viewDetail}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        {onBack && (
          <button onClick={onBack} style={{ border: 'none', background: '#fff', color: '#2E8B5E', fontWeight: 900, fontSize: 14, padding: '8px 16px', borderRadius: 14, cursor: 'pointer', boxShadow: '0 4px 12px -8px rgba(0,0,0,.2)' }}>
            ‹ 返回
          </button>
        )}
        <div style={{ ...s.hintBadge, marginBottom: 0 }}>⏱️ 長按標記進度</div>
      </header>

      <main>
        <div style={s.cookingCard}>
          {recipe.image_url && (
            <div>
              <img src={recipe.image_url} alt={recipe.title} style={s.recipeImage} />
            </div>
          )}

          <div>
            <div style={s.badgesRow}>
              {Array.isArray(recipe.category) && recipe.category.map((tag) => (
                <span key={tag} style={s.categoryBadge}>{tag}</span>
              ))}
              {parsedYieldInfo.map((yieldText, idx) => (
                <span key={idx} style={s.yieldBadge}>🍽️ {yieldText}</span>
              ))}
            </div>

            <div style={s.titleRow}>
              <img src="/chef_logo_bust.webp" alt="Peggy Chef Logo" style={s.chefLogo} />
              <h2 style={s.recipeTitle}>{recipe.title}</h2>
            </div>
          </div>

          {hasParameters && (
            <div style={s.paramsDashboard}>
              <div style={s.dashboardTitle}>重點參數</div>
              <div style={s.dashboardGrid}>
                {Object.entries(recipe.parameters).map(([key, value]) => (
                  <div key={key}>
                    <span style={s.paramKey}>{key}</span>
                    <br />
                    <span style={s.paramValue}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {baseIng && (
            <div style={s.scaleController}>
              <div style={s.scaleLabel}>⚖️ 依據主食材等比例縮放配方：</div>
              <div style={s.scaleInputs}>
                <span style={s.baseName}>{baseIng.name}</span>
                <input
                  type="number"
                  value={currentWeight}
                  onChange={(e) => setCurrentWeight(e.target.value)}
                  placeholder={baseIng.amount}
                  style={s.weightInput}
                  pattern="[0-9]*"
                />
                <span style={s.unitText}>克 (g)</span>
                {isScaled && (
                  <button type="button" style={s.resetBtn} onClick={() => setCurrentWeight('')}>重設</button>
                )}
              </div>
              {isScaled && (
                <div style={s.scaleAlert}>
                  📢 比例已調整為原本的 <b>{scaleRatio.toFixed(2)}</b> 倍
                </div>
              )}
            </div>
          )}

          {groupedIngredients.map((group) => (
            <div key={group.typeName}>
              <div style={s.sectionDivider}>
                {group.typeName === 'DEFAULT'
                  ? <span>📦 準備食材</span>
                  : <span>📦 準備食材：{group.typeName}</span>}
              </div>

              <div>
                {group.items.map((ing) => {
                  const id = `ing-${recipe.id}-${ing.name}`;
                  const isCompleted = !!completedItems[id];
                  return (
                    <div
                      key={ing.name}
                      style={{
                        ...s.ingredientRow,
                        ...(isCompleted ? s.completedOverlay : {}),
                      }}
                      {...pressHandlers(id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={s.ingName}>{ing.name}</span>
                        {ing.brand && <span style={s.ingBrand}>{ing.brand}</span>}
                      </div>
                      <span style={s.ingAmount}>{getScaledAmount(ing)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {sortedGroupedSteps.map((stepGroup) => (
            <div key={stepGroup.typeName}>
              <div style={s.sectionDivider}>
                {stepGroup.typeName === 'DEFAULT'
                  ? <span>⏱️ 料理工序</span>
                  : <span>⏱️ 料理工序：{stepGroup.typeName}</span>}
              </div>

              <ol style={s.stepsOl}>
                {stepGroup.items.map((step, index) => {
                  const id = `step-${recipe.id}-${stepGroup.typeName}-${index}`;
                  const isCompleted = !!completedItems[id];
                  return (
                    <li
                      key={index}
                      style={{
                        ...s.stepLi,
                        ...(isCompleted ? s.completedOverlay : {}),
                      }}
                      {...pressHandlers(id)}
                    >
                      <div style={s.stepNumber}>{index + 1}</div>
                      <div style={s.stepText}>{step.text}</div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}

          {formattedNotes.length > 0 && (
            <div>
              <div style={s.sectionDivider}><span>💡 心得與備註</span></div>
              <ul style={{ ...s.notesList, ...s.noteSection }}>
                {formattedNotes.map((note, index) => {
                  const id = `note-${recipe.id}-${index}`;
                  const isCompleted = !!completedItems[id];
                  return (
                    <li
                      key={index}
                      style={{
                        ...s.noteLi,
                        ...(isCompleted ? s.completedOverlay : {}),
                      }}
                      {...pressHandlers(id)}
                    >
                      <span style={s.notesBullet}>●</span>
                      <p style={s.notesText}>{note}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {recipe.last_cooked_at && (
            <div style={s.lastCooked}>
              🕒 上次製作：{formatDate(recipe.last_cooked_at)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
