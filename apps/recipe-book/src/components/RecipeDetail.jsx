// 單一食譜詳情：食材、步驟、心得、依主食材縮放配方、長按標記完成。
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
import './RecipeDetail.css';

export default function RecipeDetail({ recipe }) {
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

  return (
    <div className="view-detail">
      <header className="mobile-header detail-header">
        <div className="hint-badge">⏱️ 長按標記進度</div>
      </header>

      <main className="detail-main">
        <div className="cooking-card">
          {recipe.image_url && (
            <div className="recipe-image-wrapper">
              <img src={recipe.image_url} alt={recipe.title} className="recipe-image" />
            </div>
          )}

          <div className="card-header">
            <div className="header-badges-row">
              {Array.isArray(recipe.category) && recipe.category.map((tag) => (
                <span key={tag} className="category-badge">{tag}</span>
              ))}
              {parsedYieldInfo.map((yieldText, idx) => (
                <span key={idx} className="yield-spec-badge">🍽️ {yieldText}</span>
              ))}
            </div>

            <div className="title-with-logo-row">
              <img src="/chef_logo_bust.webp" alt="Peggy Chef Logo" className="inline-chef-logo" />
              <h2 className="recipe-title">{recipe.title}</h2>
            </div>
          </div>

          {hasParameters && (
            <div className="parameters-dashboard">
              <div className="dashboard-title">重點參數</div>
              <div className="dashboard-grid">
                {Object.entries(recipe.parameters).map(([key, value]) => (
                  <div key={key} className="dashboard-item">
                    <span className="param-key">{key}</span>
                    <span className="param-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {baseIng && (
            <div className="scale-controller">
              <div className="scale-label">⚖️ 依據主食材等比例縮放配方：</div>
              <div className="scale-inputs">
                <span className="base-name">{baseIng.name}</span>
                <input
                  type="number"
                  value={currentWeight}
                  onChange={(e) => setCurrentWeight(e.target.value)}
                  placeholder={baseIng.amount}
                  className="weight-input"
                  pattern="[0-9]*"
                />
                <span className="unit-text">克 (g)</span>
                {isScaled && (
                  <button type="button" className="reset-scale-btn" onClick={() => setCurrentWeight('')}>重設</button>
                )}
              </div>
              {isScaled && (
                <div className="scale-alert">
                  📢 比例已調整為原本的 <b>{scaleRatio.toFixed(2)}</b> 倍
                </div>
              )}
            </div>
          )}

          {groupedIngredients.map((group) => (
            <div key={group.typeName} className="card-section">
              <div className="section-divider">
                {group.typeName === 'DEFAULT'
                  ? <span>📦 準備食材</span>
                  : <span>📦 準備食材：{group.typeName}</span>}
              </div>

              <div className="mobile-ingredients-list">
                {group.items.map((ing) => {
                  const id = `ing-${recipe.id}-${ing.name}`;
                  const isCompleted = !!completedItems[id];
                  return (
                    <div
                      key={ing.name}
                      className={'ingredient-item' + (isCompleted ? ' is-completed' : '')}
                      {...pressHandlers(id)}
                    >
                      <div className="ing-name-block">
                        <span className="ing-name">{ing.name}</span>
                        {ing.brand && <span className="ing-brand-badge">{ing.brand}</span>}
                      </div>
                      <span className="ing-amount highlight-amount">{getScaledAmount(ing)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {sortedGroupedSteps.map((stepGroup) => (
            <div key={stepGroup.typeName} className="card-section">
              <div className="section-divider">
                {stepGroup.typeName === 'DEFAULT'
                  ? <span>⏱️ 料理工序</span>
                  : <span>⏱️ 料理工序：{stepGroup.typeName}</span>}
              </div>

              <ol className="cooking-steps">
                {stepGroup.items.map((step, index) => {
                  const id = `step-${recipe.id}-${stepGroup.typeName}-${index}`;
                  const isCompleted = !!completedItems[id];
                  return (
                    <li key={index} className={isCompleted ? 'is-completed' : ''} {...pressHandlers(id)}>
                      <div className="step-number">{index + 1}</div>
                      <div className="step-text">{step.text}</div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}

          {formattedNotes.length > 0 && (
            <div className="card-section note-section">
              <div className="section-divider"><span>💡 心得與備註</span></div>
              <ul className="cooking-notes-list">
                {formattedNotes.map((note, index) => {
                  const id = `note-${recipe.id}-${index}`;
                  const isCompleted = !!completedItems[id];
                  return (
                    <li key={index} className={isCompleted ? 'is-completed' : ''} {...pressHandlers(id)}>
                      <span className="notes-bullet">●</span>
                      <p className="notes-text">{note}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {recipe.last_cooked_at && (
            <div className="card-footer-history">
              <span className="history-time-text">🕒 上次製作：{formatDate(recipe.last_cooked_at)}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
