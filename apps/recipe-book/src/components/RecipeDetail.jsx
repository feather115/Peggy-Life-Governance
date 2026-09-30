// Recipe detail view: ingredients, steps, notes, recipe scaling based on base ingredient, and tap-to-complete.
// 版面：左上返回、右上編輯（擁有者）；照片 → 標題 → 按讚 → 重點參數 → 份量縮放 → 食材 / 步驟 / 心得三張清單卡。
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
import { UI } from '@peggy-life/shared/ui';

const S = {
  page: { paddingBottom: 24 },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 20px' },
  editBtn: { ...UI.btnNeutral, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 999, minHeight: 40 },
  hero: { display: 'block', width: 'calc(100% - 40px)', margin: '0 20px', aspectRatio: '3 / 2', objectFit: 'cover', borderRadius: 14 },
  titleBlock: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, padding: '20px 20px 0' },
  badgesRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  likeMeta: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' },
  likeBtn: (liked) => ({ ...UI.chip(liked), minHeight: 36, ...(liked ? { background: 'var(--like-bg)', color: 'var(--like)' } : {}) }),
  likers: { fontSize: 13, color: 'var(--text-muted)' },
  card: { ...UI.card, margin: '12px 20px 0', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  cardLabel: { fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', margin: 0 },
  paramsGrid: { margin: 0, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 },
  paramKey: { fontSize: 13, color: 'var(--text-muted)' },
  paramValue: { margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text)' },
  scaleTitle: { margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 500, color: 'var(--text)' },
  scaleRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  weightInput: { ...UI.input, width: 96, minHeight: 40, textAlign: 'right', fontWeight: 500, ...UI.num },
  hint: { fontSize: 12, color: 'var(--text-faint)' },
  groupLabel: { margin: 0, padding: '12px 16px 4px', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' },
  itemRow: (done) => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', cursor: 'pointer', color: done ? 'var(--text-faint)' : 'var(--text)' }),
  itemName: (done) => ({ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 15, textDecoration: done ? 'line-through' : 'none' }),
  itemAmount: (done) => ({ fontSize: 15, fontWeight: done ? 400 : 500, flexShrink: 0, textDecoration: done ? 'line-through' : 'none', ...UI.num }),
  stepsOl: { listStyle: 'none', padding: 0, margin: 0 },
  stepLi: (done, first) => ({ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', cursor: 'pointer', borderTop: first ? 'none' : '1px solid var(--line)', color: done ? 'var(--text-faint)' : 'var(--text)' }),
  stepNo: (done) => ({ width: 24, height: 24, flex: 'none', borderRadius: 999, background: done ? 'var(--sunken)' : 'var(--primary-soft)', color: done ? 'var(--text-faint)' : 'var(--primary-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, marginTop: 1 }),
  stepText: (done) => ({ margin: 0, fontSize: 15, lineHeight: 1.6, textDecoration: done ? 'line-through' : 'none' }),
  notesList: { listStyle: 'none', margin: 0, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 },
  noteLi: (done) => ({ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', color: done ? 'var(--text-faint)' : 'var(--text)' }),
  noteDot: { width: 5, height: 5, flex: 'none', marginTop: 10, borderRadius: 3, background: 'var(--primary-ink)' },
  noteText: (done) => ({ margin: 0, fontSize: 15, lineHeight: 1.6, textDecoration: done ? 'line-through' : 'none' }),
  lastCooked: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12, color: 'var(--text-faint)', marginTop: 24 },
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
    <div style={S.page}>
      <div style={S.topBar}>
        {onBack ? (
          <button type="button" aria-label="返回" onClick={onBack} style={UI.iconBtn}><Icon name="chevron-left" size={20} /></button>
        ) : <span />}
        {isOwner && onEdit && (
          <button type="button" onClick={onEdit} style={S.editBtn}><Icon name="pencil" size={16} />編輯</button>
        )}
      </div>

      <main>
        {recipe.image_url && <img src={recipe.image_url} alt={recipe.title} style={S.hero} />}

        <div style={S.titleBlock}>
          {(recipe.category?.length > 0 || parsedYieldInfo.length > 0) && (
            <div style={S.badgesRow}>
              {Array.isArray(recipe.category) && recipe.category.map((tag) => (
                <span key={tag} style={UI.tag('neutral')}>{tag}</span>
              ))}
              {parsedYieldInfo.map((yieldText, idx) => (
                <span key={idx} style={UI.tag('neutral')}><Icon name="utensils" size={12} />{yieldText}</span>
              ))}
            </div>
          )}
          <h1 style={UI.title}>{recipe.title}</h1>

          {isOwner ? (
            <div style={S.likeMeta}>
              <Icon name="heart" size={14} filled style={{ color: 'var(--like)' }} />{likeCount} 人按讚 · {recipe.is_shared ? '已分享' : '未分享（按編輯可開啟）'}
            </div>
          ) : isGuest ? (
            <div style={S.likeMeta}>
              <Icon name="heart" size={14} filled style={{ color: 'var(--like)' }} />{likeCount} 人按讚 · 別人分享的食譜
            </div>
          ) : (
            <button type="button" onClick={handleToggleLike} disabled={likeBusy} aria-pressed={isLiked} style={{ ...S.likeBtn(isLiked), cursor: likeBusy ? 'wait' : 'pointer' }}>
              <Icon name="heart" size={16} filled={isLiked} />{likeCount}
              <span>· {isLiked ? '已加入喜愛' : '加入喜愛'}</span>
            </button>
          )}
          {likeError && <div style={UI.fieldError}>{likeError}</div>}
          {likerNames.length > 0 && <div style={S.likers}>{likerNames.join('、')} 按讚</div>}
        </div>

        {hasParameters && (
          <section style={{ ...S.card, marginTop: 20 }}>
            <h2 style={S.cardLabel}>重點參數</h2>
            <dl style={S.paramsGrid}>
              {Object.entries(recipe.parameters).map(([key, value]) => (
                <div key={key}>
                  <dt style={S.paramKey}>{key}</dt>
                  <dd style={S.paramValue}>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {baseIng && (
          <section style={{ ...S.card, marginTop: hasParameters ? 12 : 20 }}>
            <h2 style={S.scaleTitle}><Icon name="scale" size={18} style={{ color: 'var(--text-muted)' }} />依據主食材等比例縮放配方</h2>
            <div style={S.scaleRow}>
              <label htmlFor="base-weight" style={{ fontSize: 15 }}>{baseIng.name}</label>
              <input id="base-weight"
                type="number"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                placeholder={parseFloat(baseIng.amount) || baseIng.amount}
                style={S.weightInput}
                pattern="[0-9]*"
              />
              <span style={{ fontSize: 15, color: 'var(--text-muted)' }}>克 (g)</span>
              {isScaled && (
                <button type="button" style={{ ...UI.btnText, marginLeft: 'auto' }} onClick={() => setCurrentWeight('')}>重設</button>
              )}
            </div>
            {isScaled && (
              <div style={UI.note('primary')}>
                <Icon name="info" size={14} />比例已調整為原本的 {scaleRatio.toFixed(2)} 倍
              </div>
            )}
          </section>
        )}

        {groupedIngredients.length > 0 && (
          <section style={UI.section}>
            <div style={UI.sectionHead}>
              <h2 style={UI.sectionTitle}>食材</h2>
              <span style={S.hint}>點一下劃掉</span>
            </div>
            <div style={UI.listCard}>
              {groupedIngredients.map((group, gi) => (
                <div key={group.typeName} style={gi > 0 ? { borderTop: '1px solid var(--line)' } : undefined}>
                  {group.typeName !== 'DEFAULT' && <h3 style={S.groupLabel}>{group.typeName}</h3>}
                  {group.items.map((ing, i) => {
                    const id = `ing-${recipe.id}-${ing.name}`;
                    const done = !!completedItems[id];
                    return (
                      <React.Fragment key={ing.name}>
                        {i > 0 && <div style={UI.divider} />}
                        <div style={S.itemRow(done)} {...pressHandlers(id)}>
                          <span style={S.itemName(done)}>
                            {done && <Icon name="check" size={16} strokeWidth={2} />}
                            {ing.name}
                            {ing.brand && <span style={UI.tag('info')}>{ing.brand}</span>}
                            {baseIng && ing.name === baseIng.name && <span style={UI.tag('primary')}>主食材</span>}
                          </span>
                          <span style={S.itemAmount(done)}>{getScaledAmount(ing)}</span>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>
        )}

        {sortedGroupedSteps.length > 0 && (
          <section style={UI.section}>
            <div style={UI.sectionHead}><h2 style={UI.sectionTitle}>料理工序</h2></div>
            <div style={UI.listCard}>
              {sortedGroupedSteps.map((stepGroup, gi) => (
                <div key={stepGroup.typeName} style={gi > 0 ? { borderTop: '1px solid var(--line)' } : undefined}>
                  {stepGroup.typeName !== 'DEFAULT' && <h3 style={S.groupLabel}>{stepGroup.typeName}</h3>}
                  <ol style={S.stepsOl}>
                    {stepGroup.items.map((step, index) => {
                      const id = `step-${recipe.id}-${stepGroup.typeName}-${index}`;
                      const done = !!completedItems[id];
                      return (
                        <li key={index} style={S.stepLi(done, index === 0)} {...pressHandlers(id)}>
                          <span style={S.stepNo(done)}>{index + 1}</span>
                          <p style={S.stepText(done)}>{step.text}</p>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
          </section>
        )}

        {formattedNotes.length > 0 && (
          <section style={UI.section}>
            <div style={UI.sectionHead}><h2 style={UI.sectionTitle}>心得與備註</h2></div>
            <ul style={{ ...UI.card, ...S.notesList }}>
              {formattedNotes.map((note, index) => {
                const id = `note-${recipe.id}-${index}`;
                const done = !!completedItems[id];
                return (
                  <li key={index} style={S.noteLi(done)} {...pressHandlers(id)}>
                    <span aria-hidden="true" style={S.noteDot} />
                    <p style={S.noteText(done)}>{note}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {recipe.last_cooked_at && (
          <div style={S.lastCooked}>
            <Icon name="clock" size={14} />上次製作：{formatDate(recipe.last_cooked_at)}
          </div>
        )}
      </main>
    </div>
  );
}
