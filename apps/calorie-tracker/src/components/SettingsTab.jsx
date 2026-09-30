// Settings tab: 分組清單（個人資料、每日目標、標籤、其他 App、帳號、資料）＋ 登出。三個 app 的設定頁用同一個版型。
// 標籤的新增／刪除／換色放在「標籤」列點開的面板裡（設定頁本身只列出摘要）
import React, { useState } from 'react';
import { FOODS } from '../constants.js';
import { totalRecordedDays } from '../selectors.js';
import { alertError, readableOn } from '../utils.js';
import { supabase } from '../supabase.js';
import { canLinkLine, useLineLinked } from '../liff.js';
import Sheet, { SheetHeader } from './Sheet.jsx';
import Icon from '@peggy-life/shared/Icon.jsx';
import { UI } from '@peggy-life/shared/ui';
import { confirmDialog } from '@peggy-life/shared/feedback.jsx';
import OtherApps from '@peggy-life/shared/OtherApps.jsx';

const TAG_COLORS = ['#E8A13C', '#D9544F', '#EC4899', '#8B5CF6', 'var(--info)', '#5FA8D3', '#14B8A6', 'var(--primary)'];

const S = {
  page: { paddingBottom: 24 },
  group: { margin: '28px 20px 0', display: 'flex', flexDirection: 'column', gap: 8 },
  groupHint: { margin: 0, padding: '0 4px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 },
  fieldRow: { ...UI.row, cursor: 'default' },
  rowLabel: { flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 },
  rowSummary: { flex: '0 1 auto', minWidth: 0, maxWidth: '55%', fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  rowIcon: { color: 'var(--text-muted)' },
  chevron: { color: 'var(--text-faint)' },
  textInput: { ...UI.input, width: 180, minHeight: 36, textAlign: 'right' },
  numInput: { ...UI.input, width: 88, minHeight: 36, padding: '0 10px', textAlign: 'right', fontWeight: 500, ...UI.num },
  unit: { width: 32, fontSize: 13, color: 'var(--text-muted)' },
  dot: (color) => ({ width: 8, height: 8, borderRadius: 4, background: color, flex: 'none' }),
  linked: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 500, color: 'var(--success-ink)' },
  rowNote: { padding: '0 16px 12px' },
  inlineForm: { padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 },
  info: { ...UI.row, fontSize: 15, ...UI.num },
  dangerRow: { ...UI.row, color: 'var(--danger-ink)', fontSize: 15, fontWeight: 500 },
  signOut: { margin: '28px 20px 0' },
  footer: { margin: '16px 0 0', textAlign: 'center', fontSize: 12, color: 'var(--text-faint)' },
  sheetBody: { flex: 1, overflowY: 'auto', padding: '8px 20px 28px', display: 'flex', flexDirection: 'column', gap: 20 },
  tagChip: (bg, fg) => ({ minHeight: 36, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 6px 0 12px', borderRadius: 999, background: bg, color: fg, fontSize: 14, fontWeight: 500 }),
  colorDot: (hex) => ({ width: 18, height: 18, padding: 0, marginLeft: -4, borderRadius: 999, border: '2px solid rgba(255,255,255,.9)', background: hex }),
  tagDel: (fg) => ({ width: 24, height: 24, padding: 0, border: 'none', borderRadius: 999, background: 'none', color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center' }),
  swatches: { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  swatch: (hex, on) => ({ width: 28, height: 28, padding: 0, border: 'none', borderRadius: 999, background: hex, boxShadow: on ? '0 0 0 2px var(--surface), 0 0 0 4px var(--text)' : 'inset 0 0 0 1px rgba(0,0,0,.08)' }),
  emptyTags: { fontSize: 13, color: 'var(--text-faint)' },
};

export default function SettingsTab({ app, session, onSignOut }) {
  const {
    days, customFoods,
    displayName, setDisplayName,
    goalCal, goalP, goalC, goalF, setGoalCal, setGoalP, setGoalC, setGoalF,
    fastingTagDefs, otherTagDefs, addTagDef, updateTagColor, deleteTagDef, clearAll,
  } = app;

  const [addFastingInput, setAddFastingInput] = useState('');
  const [addOtherInput, setAddOtherInput] = useState('');
  const [addOtherColor, setAddOtherColor] = useState(TAG_COLORS[0]);
  const [confirmClear, setConfirmClear] = useState(false);
  const [tagSheet, setTagSheet] = useState(null); // 'fasting' | 'other' | null

  const totalRec = totalRecordedDays(days);
  const displayEmail = (() => {
    const email = session.user.email || '';
    if (email.endsWith('@line.invalid')) {
      const match = email.match(/^line-(U[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{4})@line\.invalid$/);
      return match ? `LINE: ${match[1]}...${match[2]}` : 'LINE 登入帳號';
    }
    return email;
  })();

  const goals = [
    { label: '熱量', aria: '目標卡路里', unit: 'kcal', val: goalCal, set: setGoalCal, step: 50, min: 800, max: 4000 },
    { label: '蛋白質', aria: '蛋白質 (g)', unit: 'g', dot: 'var(--primary-ink)', val: goalP, set: setGoalP, step: 5, min: 0 },
    { label: '碳水', aria: '碳水 (g)', unit: 'g', dot: 'var(--carb)', val: goalC, set: setGoalC, step: 5, min: 0 },
    { label: '脂肪', aria: '脂肪 (g)', unit: 'g', dot: 'var(--fat)', val: goalF, set: setGoalF, step: 5, min: 0 },
  ];

  const submitFasting = async () => {
    const label = addFastingInput.trim();
    if (!label) return;
    try {
      await addTagDef('fasting', label);
    } catch (e) {
      alertError('新增標籤', e);
      return;
    }
    setAddFastingInput('');
  };
  const submitOther = async () => {
    const label = addOtherInput.trim();
    if (!label) return;
    try {
      await addTagDef('other', label, addOtherColor);
    } catch (e) {
      alertError('新增標籤', e);
      return;
    }
    setAddOtherInput('');
  };
  const doClear = async () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    if (!(await confirmDialog({ title: '清除所有資料？', message: '所有飲食紀錄與自訂食物都會刪除，無法復原。', confirmText: '全部清除', danger: true }))) {
      setConfirmClear(false);
      return;
    }
    try {
      await clearAll();
    } catch (e) {
      alertError('清除', e);
    }
    setConfirmClear(false);
  };

  const tagRows = [
    { key: 'fasting', icon: 'timer', label: '斷食標籤', tags: fastingTagDefs },
    { key: 'other', icon: 'tag', label: '記錄原因標籤', tags: otherTagDefs },
  ];

  return (
    <div style={S.page}>
      <header style={UI.header}>
        <div style={{ minWidth: 0 }}>
          <h1 style={UI.title}>設定</h1>
          <p style={UI.subtitle}>{displayEmail}</p>
        </div>
      </header>

      <section style={S.group}>
        <h2 style={UI.groupLabel}>個人資料</h2>
        <div style={UI.listCard}>
          <label style={S.fieldRow}>
            <span style={S.rowLabel}>暱稱</span>
            <input aria-label="暱稱" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="例如：小明" maxLength={20} style={S.textInput} />
          </label>
        </div>
        <p style={S.groupHint}>會顯示在紀錄頁的問候語</p>
      </section>

      <section style={S.group}>
        <h2 style={UI.groupLabel}>每日目標</h2>
        <div style={UI.listCard}>
          {goals.map((g, i) => (
            <React.Fragment key={g.label}>
              {i > 0 && <div style={UI.divider} />}
              <label style={S.fieldRow}>
                <span style={S.rowLabel}>{g.dot && <span style={S.dot(g.dot)} />}{g.label}</span>
                <input aria-label={g.aria} type="number" value={g.val} onChange={(e) => { const n = parseInt(e.target.value); if (!isNaN(n) && n >= 0) g.set(n); }} step={g.step} min={g.min} max={g.max} style={S.numInput} />
                <span style={S.unit}>{g.unit}</span>
              </label>
            </React.Fragment>
          ))}
        </div>
      </section>

      <section style={S.group}>
        <h2 style={UI.groupLabel}>標籤</h2>
        <div style={UI.listCard}>
          {tagRows.map((r, i) => (
            <React.Fragment key={r.key}>
              {i > 0 && <div style={UI.divider} />}
              <button type="button" onClick={() => setTagSheet(r.key)} style={UI.row}>
                <Icon name={r.icon} size={20} style={S.rowIcon} />
                <span style={S.rowLabel}>{r.label}</span>
                <span style={S.rowSummary}>{r.tags.map((t) => t.label).join('、') || '尚未設定'}</span>
                <Icon name="chevron-right" size={18} style={S.chevron} />
              </button>
            </React.Fragment>
          ))}
        </div>
      </section>

      <OtherApps current="calorie" style={S.group} />

      <section style={S.group}>
        <h2 style={UI.groupLabel}>帳號</h2>
        <div style={UI.listCard}>
          <PasswordChanger />
          <LineLinker />
        </div>
        {canLinkLine() && <p style={S.groupHint}>連結後，之後從 LINE 開啟會直接登入這個帳號</p>}
      </section>

      <section style={S.group}>
        <h2 style={UI.groupLabel}>資料</h2>
        <div style={UI.listCard}>
          <div style={S.info}>已記錄 {totalRec} 天 · 食物庫 {FOODS.length} + {customFoods.length} 自訂</div>
          <div style={UI.divider} />
          {!confirmClear ? (
            <button type="button" onClick={doClear} style={S.dangerRow}>清除全部資料</button>
          ) : (
            <div style={{ ...UI.row, gap: 8 }}>
              <button type="button" onClick={doClear} style={{ ...UI.btnDanger, flex: 1 }}>確定清除</button>
              <button type="button" onClick={() => setConfirmClear(false)} style={{ ...UI.btnNeutral, flex: 1 }}>取消</button>
            </div>
          )}
        </div>
      </section>

      <div style={S.signOut}>
        <button type="button" onClick={onSignOut} style={{ ...UI.btnNeutral, width: '100%', minHeight: 48, fontSize: 15 }}>登出</button>
      </div>
      <p style={S.footer}>TY Calorie Tracker</p>

      {tagSheet && (
        <Sheet label={tagSheet === 'fasting' ? '斷食標籤' : '記錄原因標籤'} onBackdrop={() => setTagSheet(null)} height="min(70vh, 600px)" zIndex={12}>
          <SheetHeader
            title={tagSheet === 'fasting' ? '斷食標籤' : '記錄原因標籤'}
            subtitle={tagSheet === 'fasting' ? '在紀錄頁的「進階設定」勾選' : '聚餐、旅行等特殊情況，報表會用顏色標出來'}
            onClose={() => setTagSheet(null)} />
          <div className="ps" style={S.sheetBody}>
            {tagSheet === 'fasting' ? (
              <TagGroup tags={fastingTagDefs} onDelete={(id) => deleteTagDef('fasting', id).catch((e) => alertError('刪除標籤', e))}
                input={addFastingInput} setInput={setAddFastingInput} onAdd={submitFasting} placeholder="新增斷食標籤…" />
            ) : (
              <TagGroup tags={otherTagDefs} onDelete={(id) => deleteTagDef('other', id).catch((e) => alertError('刪除標籤', e))}
                onColor={(id, color) => updateTagColor('other', id, color)}
                input={addOtherInput} setInput={setAddOtherInput} onAdd={submitOther} placeholder="新增標籤（如：聚餐、旅行）…"
                color={addOtherColor} setColor={setAddOtherColor} />
            )}
          </div>
        </Sheet>
      )}
    </div>
  );
}

// 標籤清單＋新增（斷食標籤用資訊色；記錄原因標籤用各自的顏色，可點圓點換色）
function TagGroup({ tags, onDelete, onColor, input, setInput, onAdd, placeholder, color, setColor }) {
  const [editingColorId, setEditingColorId] = useState(null);
  return (
    <>
      <div style={UI.chipRow}>
        {tags.length === 0 && <span style={S.emptyTags}>還沒有標籤</span>}
        {tags.map((mt) => {
          const bg = onColor ? (mt.color || '#E8A13C') : 'var(--info-bg)';
          const fg = onColor ? readableOn(bg) : 'var(--info-ink)';
          return (
            <div key={mt.id}>
              <div style={S.tagChip(bg, fg)}>
                {onColor && <button type="button" aria-label={`改「${mt.label}」的顏色`} className="tap" onClick={() => setEditingColorId(editingColorId === mt.id ? null : mt.id)} style={S.colorDot(bg)} />}
                <span>{mt.label}</span>
                <button type="button" aria-label={`刪除標籤「${mt.label}」`} className="tap" onClick={async () => { if (await confirmDialog({ title: `刪除標籤「${mt.label}」？`, message: '過去紀錄上的這個標籤也會一起消失。', confirmText: '刪除', danger: true })) onDelete(mt.id); }} style={S.tagDel(fg)}><Icon name="x" size={14} /></button>
              </div>
              {onColor && editingColorId === mt.id && (
                <ColorSwatches
                  current={mt.color || '#E8A13C'}
                  onPick={async (next) => { try { await onColor(mt.id, next); setEditingColorId(null); } catch (e) { alertError('更新顏色', e); } }}
                />
              )}
            </div>
          );
        })}
      </div>
      {setColor && (
        <div>
          <span style={UI.fieldLabel}>新標籤的顏色</span>
          <ColorSwatches current={color} onPick={setColor} />
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <input aria-label={placeholder} value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder} style={{ ...UI.input, flex: 1, minWidth: 0 }} />
        <button type="button" onClick={onAdd} style={{ ...UI.btnSecondary, minHeight: 44 }}><Icon name="plus" size={16} />新增</button>
      </div>
    </>
  );
}

function ColorSwatches({ current, onPick }) {
  return (
    <div style={S.swatches}>
      {TAG_COLORS.map((hex) => (
        <button key={hex} type="button" aria-label={`顏色 ${hex}`} aria-pressed={hex === current} onClick={() => onPick(hex)} style={S.swatch(hex, hex === current)} />
      ))}
    </div>
  );
}

const LINE_LINKED_CACHE_KEY = 'calorie-tracker:line-linked';

// Link LINE Account: shows current link status (checked on mount, works in any browser),
// and offers the "connect" button only when opened within the LINE App and not yet linked.
// 連結狀態邏輯（含 localStorage 快取）在 @peggy-life/shared/lineAuth 的 useLineLinked，三個 app 共用，這裡只負責畫面。
function LineLinker() {
  const { linked, busy, msg, link } = useLineLinked(LINE_LINKED_CACHE_KEY);

  if (!linked && !canLinkLine()) return null;

  return (
    <>
      <div style={UI.divider} />
      <div style={UI.row}>
        <Icon name="link" size={20} style={S.rowIcon} />
        <span style={S.rowLabel}>LINE 帳號</span>
        {linked
          ? <span style={S.linked}><Icon name="check-circle" size={16} />已連結</span>
          : <button type="button" onClick={link} disabled={busy} style={{ ...UI.btnSecondary, minHeight: 36 }}>{busy ? '連結中…' : '連結'}</button>}
      </div>
      {!linked && msg === 'success' && <div style={S.rowNote}><div style={UI.note('success')}>已連結成功</div></div>}
      {!linked && msg && msg !== 'success' && <div style={S.rowNote}><div style={UI.note('danger')}>{msg}</div></div>}
    </>
  );
}

// Password change component
function PasswordChanger() {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (pw.length < 6) { setMsg('密碼至少 6 字元'); return; }
    setBusy(true); setMsg('');
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) setMsg(error.message);
    else { setMsg('密碼已更新'); setPw(''); setTimeout(() => { setOpen(false); setMsg(''); }, 1500); }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} style={UI.row}>
        <Icon name="key" size={20} style={S.rowIcon} />
        <span style={S.rowLabel}>變更密碼</span>
        <Icon name="chevron-right" size={18} style={{ ...S.chevron, transform: open ? 'rotate(90deg)' : 'none' }} />
      </button>
      {open && (
        <div style={S.inlineForm}>
          <input aria-label="新密碼" type="password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={6} placeholder="新密碼，至少 6 字元" style={UI.input} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={save} disabled={busy} style={{ ...UI.btnPrimary, flex: 1, minHeight: 44, fontSize: 14 }}>{busy ? '更新中…' : '儲存新密碼'}</button>
            <button type="button" onClick={() => { setOpen(false); setPw(''); setMsg(''); }} style={{ ...UI.btnNeutral, flex: 1, minHeight: 44 }}>取消</button>
          </div>
          {msg && <div style={UI.note(msg === '密碼已更新' ? 'success' : 'danger')}>{msg}</div>}
        </div>
      )}
    </>
  );
}
