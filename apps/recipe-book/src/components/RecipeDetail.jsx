// Recipe detail view: ingredients, steps, notes, recipe scaling based on base ingredient, and long-press to complete.
import React, { useMemo, useState } from 'react';
import {
  formatDate,
  groupItemsByType,
  groupStepsByType,
  parseIngredients,
  parseNotes,
  parseSteps,
  parseYieldInfo,
} from '../utils.js';
import Icon from '@peggy-life/shared/Icon.jsx';

const S = {
  viewDetail: { padding: '6px 18px 20px' },
  hintBadge: { background: 'var(--surface-alt)', color: 'var(--text-muted)', padding: '6px 14px', borderRadius: 20, fontWeight: 800, fontSize: 12, textAlign: 'center', marginBottom: 8 },
  cookingCard: { background: 'var(--surface)', borderRadius: 28, padding: '20px 18px', boxShadow: 'var(--shadow-card)' },
  recipeImage: { width: '100%', height: 200, objectFit: 'cover', borderRadius: 14, marginBottom: 14 },
  badgesRow: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  categoryBadge: { background: 'var(--primary)', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800 },
  yieldBadge: { display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--surface-alt)', color: 'var(--text-muted)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800 },
  titleRow: { display: 'flex', alignItems: 'center', marginBottom: 10 },
  recipeTitle: { fontSize: 24, fontWeight: 900, color: 'var(--text)', margin: 0 },
  paramsDashboard: { background: 'var(--surface-alt)', borderRadius: 14, padding: 14, marginBottom: 10 },
  dashboardTitle: { fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8 },
  dashboardGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  paramKey: { fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' },
  paramValue: { fontSize: 16, fontWeight: 900, color: 'var(--text)' },
  scaleController: { background: 'var(--surface-alt)', borderRadius: 14, padding: 14, marginBottom: 10 },
  scaleLabel: { fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 },
  scaleInputs: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  baseName: { fontSize: 14, fontWeight: 800, color: 'var(--text)' },
  weightInput: { border: 'none', background: 'var(--surface)', borderRadius: 14, padding: '10px 12px', fontSize: 16, fontWeight: 800, color: 'var(--text)', width: 80 },
  unitText: { fontSize: 13, color: 'var(--text-muted)', fontWeight: 700 },
  resetBtn: { background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 14, padding: '8px 14px', fontSize: 13, fontWeight: 800, cursor: 'pointer' },
  scaleAlert: { background: 'var(--primary-soft)', color: 'var(--primary-ink)', borderRadius: 14, padding: '8px 12px', fontSize: 13, fontWeight: 700, marginTop: 8 },
  sectionTitle: { display: 'inline-flex', alignItems: 'center', gap: 6 },
  sectionDivider: { fontSize: 15, fontWeight: 900, color: 'var(--text)', marginTop: 20, marginBottom: 10 },
  ingredientRow: { cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--surface-alt)', borderRadius: 14, marginBottom: 6 },
  ingName: { fontSize: 14, fontWeight: 800, color: 'var(--text)' },
  ingBrand: { fontSize: 12, background: 'var(--info-bg)', color: 'var(--info-ink)', borderRadius: 10, padding: '2px 8px', marginLeft: 6 },
  ingAmount: { fontSize: 14, fontWeight: 900, color: 'var(--primary-ink)' },
  completedOverlay: { opacity: 0.25, textDecoration: 'line-through' },
  stepsOl: { listStyle: 'none', padding: 0, margin: 0 },
  stepLi: { cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  stepNumber: { width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 },
  stepText: { fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.6 },
  noteSection: { background: 'var(--surface-alt)', borderRadius: 14, padding: 14, border: '1px solid var(--line)' },
  notesList: { listStyle: 'none', padding: 0, margin: 0 },
  noteLi: { cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  notesBullet: { color: 'var(--primary-ink)', fontWeight: 800, flexShrink: 0 },
  notesText: { margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.6 },
  lastCooked: { fontSize: 12, color: 'var(--text-faint)', fontWeight: 700, textAlign: 'center', marginTop: 16 },
};

export default function RecipeDetail({ recipe, onBack, currentUserId, isGuest, onEdit, likeCount = 0, isLiked = false, onToggleLike, likerNames = [] }) {
  const [currentWeight, setCurrentWeight] = useState('');
  const [completedItems, setCompletedItems] = useState({});
  const [likeBusy, setLikeBusy] = useState(false);
  const [likeError, setLikeError] = useState('');

  const isOwner = !isGuest && currentUserId && recipe.user_id === currentUserId;

  const handleToggleLike = async () => {
    if (isGuest || !onToggleLike) return;
    setLikeBusy(true);
    setLikeError('');
    try {
      await onToggleLike(recipe.id);
    } catch (e) {
      setLikeError(e.message || '按讚失敗');
    } finally {
      setLikeBusy(false);
    }
  };

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

  // 點一下劃掉/恢復某個食材、步驟或備註（原本要長按 0.7 秒，不好發現，慢慢捲動時還會誤觸）
  function pressHandlers(id) {
    const toggle = () => setCompletedItems((prev) => ({ ...prev, [id]: !prev[id] }));
    return {
      role: 'checkbox',
      tabIndex: 0,
      'aria-checked': !!completedItems[id],
      onClick: toggle,
      onKeyDown: (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } },
    };
  }

  return (
    <div style={S.viewDetail}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        {onBack && (
          <button onClick={onBack} style={{ border: 'none', background: 'var(--surface)', color: 'var(--primary-ink)', fontWeight: 900, fontSize: 14, padding: '8px 16px', borderRadius: 14, cursor: 'pointer', boxShadow: '0 4px 12px -8px rgba(0,0,0,.2)' }}>
            ‹ 返回
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isOwner && onEdit && (
            <button onClick={onEdit} style={{ border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 900, fontSize: 13, padding: '8px 14px', borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="pencil" size={14} />編輯
            </button>
          )}
          <div style={{ ...S.hintBadge, marginBottom: 0 }}>✓ 點一下標記進度</div>
        </div>
      </header>

      <main>
        <div style={S.cookingCard}>
          {recipe.image_url && (
            <div>
              <img src={recipe.image_url} alt={recipe.title} style={S.recipeImage} />
            </div>
          )}

          <div>
            <div style={S.badgesRow}>
              {Array.isArray(recipe.category) && recipe.category.map((tag) => (
                <span key={tag} style={S.categoryBadge}>{tag}</span>
              ))}
              {parsedYieldInfo.map((yieldText, idx) => (
                <span key={idx} style={S.yieldBadge}><Icon name="utensils" size={12} />{yieldText}</span>
              ))}
            </div>

            <div style={S.titleRow}>
              <h2 style={S.recipeTitle}>{recipe.title}</h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              {isOwner ? (
                <div style={{ background: 'var(--surface-alt)', padding: '8px 12px', borderRadius: 14, fontSize: 13, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="heart" size={14} filled style={{ color: 'var(--like)' }} />{likeCount} 人按讚
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>
                    · {recipe.is_shared ? '已分享' : '未分享（按編輯可開啟）'}
                  </span>
                </div>
              ) : isGuest ? (
                <div style={{ background: 'var(--surface-alt)', padding: '8px 12px', borderRadius: 14, fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="heart" size={14} filled style={{ color: 'var(--like)' }} />{likeCount} 人按讚 · 別人分享的食譜
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleLike}
                  disabled={likeBusy}
                  style={{
                    border: 'none',
                    background: isLiked ? 'var(--like-bg)' : 'var(--surface-alt)',
                    color: isLiked ? 'var(--like)' : 'var(--text)',
                    padding: '8px 14px',
                    borderRadius: 14,
                    fontSize: 13,
                    fontWeight: 900,
                    cursor: likeBusy ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Icon name="heart" size={15} filled={isLiked} />{likeCount}
                  <span style={{ fontSize: 12, fontWeight: 700, color: isLiked ? 'var(--like)' : 'var(--text-muted)' }}>
                    {isLiked ? '已加入喜愛' : '加入喜愛'}
                  </span>
                </button>
              )}
              {likeError && (
                <div style={{ fontSize: 12, color: 'var(--danger-ink)', fontWeight: 800 }}>{likeError}</div>
              )}
              {likerNames.length > 0 && (
                <div style={{ width: '100%', fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>
                  {likerNames.join('、')} 按讚
                </div>
              )}
            </div>
          </div>

          {hasParameters && (
            <div style={S.paramsDashboard}>
              <div style={S.dashboardTitle}>重點參數</div>
              <div style={S.dashboardGrid}>
                {Object.entries(recipe.parameters).map(([key, value]) => (
                  <div key={key}>
                    <span style={S.paramKey}>{key}</span>
                    <br />
                    <span style={S.paramValue}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {baseIng && (
            <div style={S.scaleController}>
              <div style={S.scaleLabel}><Icon name="scale" size={15} />依據主食材等比例縮放配方：</div>
              <div style={S.scaleInputs}>
                <span style={S.baseName}>{baseIng.name}</span>
                <input aria-label={`${baseIng.name} 用量`}
                  type="number"
                  value={currentWeight}
                  onChange={(e) => setCurrentWeight(e.target.value)}
                  placeholder={parseFloat(baseIng.amount) || baseIng.amount}
                  style={S.weightInput}
                  pattern="[0-9]*"
                />
                <span style={S.unitText}>克 (g)</span>
                {isScaled && (
                  <button type="button" style={S.resetBtn} onClick={() => setCurrentWeight('')}>重設</button>
                )}
              </div>
              {isScaled && (
                <div style={S.scaleAlert}>
                  <Icon name="info" size={14} style={{ marginRight: 4 }} />比例已調整為原本的 <b>{scaleRatio.toFixed(2)}</b> 倍
                </div>
              )}
            </div>
          )}

          {groupedIngredients.map((group) => (
            <div key={group.typeName}>
              <div style={S.sectionDivider}>
                {group.typeName === 'DEFAULT'
                  ? <span style={S.sectionTitle}><Icon name="list" size={16} />準備食材</span>
                  : <span style={S.sectionTitle}><Icon name="list" size={16} />準備食材：{group.typeName}</span>}
              </div>

              <div>
                {group.items.map((ing) => {
                  const id = `ing-${recipe.id}-${ing.name}`;
                  const isCompleted = !!completedItems[id];
                  return (
                    <div
                      key={ing.name}
                      style={{
                        ...S.ingredientRow,
                        ...(isCompleted ? S.completedOverlay : {}),
                      }}
                      {...pressHandlers(id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={S.ingName}>{ing.name}</span>
                        {ing.brand && <span style={S.ingBrand}>{ing.brand}</span>}
                      </div>
                      <span style={S.ingAmount}>{getScaledAmount(ing)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {sortedGroupedSteps.map((stepGroup) => (
            <div key={stepGroup.typeName}>
              <div style={S.sectionDivider}>
                {stepGroup.typeName === 'DEFAULT'
                  ? <span style={S.sectionTitle}><Icon name="clock" size={16} />料理工序</span>
                  : <span style={S.sectionTitle}><Icon name="clock" size={16} />料理工序：{stepGroup.typeName}</span>}
              </div>

              <ol style={S.stepsOl}>
                {stepGroup.items.map((step, index) => {
                  const id = `step-${recipe.id}-${stepGroup.typeName}-${index}`;
                  const isCompleted = !!completedItems[id];
                  return (
                    <li
                      key={index}
                      style={{
                        ...S.stepLi,
                        ...(isCompleted ? S.completedOverlay : {}),
                      }}
                      {...pressHandlers(id)}
                    >
                      <div style={S.stepNumber}>{index + 1}</div>
                      <div style={S.stepText}>{step.text}</div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}

          {formattedNotes.length > 0 && (
            <div>
              <div style={S.sectionDivider}><span style={S.sectionTitle}><Icon name="lightbulb" size={16} />心得與備註</span></div>
              <ul style={{ ...S.notesList, ...S.noteSection }}>
                {formattedNotes.map((note, index) => {
                  const id = `note-${recipe.id}-${index}`;
                  const isCompleted = !!completedItems[id];
                  return (
                    <li
                      key={index}
                      style={{
                        ...S.noteLi,
                        ...(isCompleted ? S.completedOverlay : {}),
                      }}
                      {...pressHandlers(id)}
                    >
                      <span style={S.notesBullet}>●</span>
                      <p style={S.notesText}>{note}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {recipe.last_cooked_at && (
            <div style={S.lastCooked}>
              <Icon name="clock" size={13} style={{ marginRight: 4 }} />上次製作：{formatDate(recipe.last_cooked_at)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
