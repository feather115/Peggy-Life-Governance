// Settings tab: account/sign out, profile (nickname + change password), daily goal, tags management, data clearing
import React, { useState } from 'react';
import { FOODS } from '../constants.js';
import { totalRecordedDays } from '../selectors.js';
import { alertError } from '../utils.js';
import { supabase } from '../supabase.js';
import { canLinkLine, useLineLinked } from '../liff.js';
import Icon from '@peggy-life/shared/Icon.jsx';

const TAG_COLORS = ['#E8A13C', '#D9544F', '#EC4899', '#8B5CF6', 'var(--info)', '#5FA8D3', '#14B8A6', 'var(--primary)'];

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
    { label: '蛋白質 (g)', color: 'var(--primary)', val: goalP, set: setGoalP },
    { label: '碳水 (g)', color: '#E8A13C', val: goalC, set: setGoalC },
    { label: '脂肪 (g)', color: '#5FA8D3', val: goalF, set: setGoalF },
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
    if (!confirm('⚠️ 警告：確定要清除所有的飲食紀錄與自訂食物嗎？這個動作將會刪除所有歷史資料，且無法復原！')) {
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

  return (
    <div style={{ padding: '6px 18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', marginBottom: 4 }}>設定</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 700 }}>{displayEmail}</div>
        </div>
        <button onClick={onSignOut} style={{ border: 'none', background: 'var(--sunken)', color: 'var(--text-muted)', fontWeight: 800, fontSize: 13, padding: '8px 14px', borderRadius: 14, cursor: 'pointer' }}>登出</button>
      </div>

      {/* Personal Profile */}
      <div style={{ background: 'var(--surface)', borderRadius: 24, padding: '20px 18px', marginTop: 14, boxShadow: 'var(--shadow-card)' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)', marginBottom: 14 }}>個人資料</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 6 }}>暱稱</div>
        <input aria-label="暱稱" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="例如：小明" maxLength={20}
          style={{ width: '100%', border: 'none', background: 'var(--surface-alt)', borderRadius: 14, padding: '14px 15px', fontSize: 16, fontWeight: 800, color: 'var(--text)' }} />
        <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 6, fontWeight: 600 }}>會顯示在紀錄頁的問候語</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start', marginTop: 14 }}>
          <PasswordChanger />
          <LineLinker />
        </div>
        {canLinkLine() && (
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 6, fontWeight: 600 }}>
            連結後，之後從 LINE 開啟會直接登入這個帳號
          </div>
        )}
      </div>

      {/* Daily Goals */}
      <div style={{ background: 'var(--surface)', borderRadius: 24, padding: '20px 18px', marginTop: 14, boxShadow: 'var(--shadow-card)' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)', marginBottom: 14 }}>每日目標</div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 6 }}>卡路里 (kcal)</div>
          <input aria-label="目標卡路里" type="number" value={goalCal} onChange={(e) => { const n = parseInt(e.target.value); if (!isNaN(n) && n >= 0) setGoalCal(n); }} step="50" min="800" max="4000" style={{ width: '100%', border: 'none', background: 'var(--surface-alt)', borderRadius: 14, padding: '14px 15px', fontSize: 20, fontWeight: 900, color: 'var(--text)' }} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {goals.map((g) => (
            <div key={g.label} style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: g.color, marginBottom: 6 }}>{g.label}</div>
              <input aria-label={g.label} type="number" value={g.val} onChange={(e) => { const n = parseInt(e.target.value); if (!isNaN(n) && n >= 0) g.set(n); }} step="5" min="0" style={{ width: '100%', border: 'none', background: 'var(--surface-alt)', borderRadius: 14, padding: 12, fontSize: 16, fontWeight: 800, color: 'var(--text)' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Tag Management */}
      <div style={{ background: 'var(--surface)', borderRadius: 24, padding: '20px 18px', marginTop: 12, boxShadow: 'var(--shadow-card)' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)', marginBottom: 16 }}>標籤管理</div>
        <TagGroup title="⏱ 斷食標籤" titleColor="var(--info)" chipBg="var(--info-bg)" chipColor="var(--info)" delColor="#8899DD"
          tags={fastingTagDefs} onDelete={(id) => deleteTagDef('fasting', id).catch((e) => alertError('刪除標籤', e))}
          input={addFastingInput} setInput={setAddFastingInput} onAdd={submitFasting} addBg="var(--info)" placeholder="新增斷食標籤…" />
        <div style={{ height: 20 }} />
        <TagGroup title="🏷 記錄原因標籤" titleColor="#C4780A" chipBg="#FFF3DC" chipColor="#8B5A00" delColor="#D4923E"
          tags={otherTagDefs} onDelete={(id) => deleteTagDef('other', id).catch((e) => alertError('刪除標籤', e))}
          onColor={(id, color) => updateTagColor('other', id, color)}
          input={addOtherInput} setInput={setAddOtherInput} onAdd={submitOther} addBg={addOtherColor} placeholder="新增標籤（如：聚餐、旅行）…"
          color={addOtherColor} setColor={setAddOtherColor} />
      </div>

      {/* Data Management */}
      <div style={{ background: 'var(--surface)', borderRadius: 24, padding: '20px 18px', marginTop: 12, boxShadow: 'var(--shadow-card)' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)', marginBottom: 6 }}>資料管理</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 14 }}>已記錄 {totalRec} 天 · 食物庫 {FOODS.length} + {customFoods.length} 自訂</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {!confirmClear && <button onClick={doClear} style={{ flex: 1, border: 'none', background: 'var(--sunken)', color: '#D9544F', fontWeight: 800, fontSize: 14, padding: 14, borderRadius: 16, cursor: 'pointer' }}>清除全部</button>}
          {confirmClear && <>
            <button onClick={doClear} style={{ flex: 1, border: 'none', background: '#D9544F', color: '#fff', fontWeight: 800, fontSize: 14, padding: 14, borderRadius: 16, cursor: 'pointer' }}>確定清除</button>
            <button onClick={() => setConfirmClear(false)} style={{ flex: 1, border: 'none', background: 'var(--sunken)', color: 'var(--text-muted)', fontWeight: 800, fontSize: 14, padding: 14, borderRadius: 16, cursor: 'pointer' }}>取消</button>
          </>}
        </div>
      </div>
    </div>
  );
}

// Tag groups (shared between fasting and other tag types)
function TagGroup({ title, titleColor, chipBg, chipColor, delColor, tags, onDelete, onColor, input, setInput, onAdd, addBg, placeholder, color, setColor }) {
  const [editingColorId, setEditingColorId] = useState(null);
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 900, color: titleColor, marginBottom: 8, letterSpacing: 0.3 }}>{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 28 }}>
        {tags.map((mt) => (
          <div key={mt.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: onColor ? (mt.color || chipBg) : chipBg, borderRadius: 12, padding: '5px 6px 5px 8px' }}>
              {onColor && <button onClick={() => setEditingColorId(editingColorId === mt.id ? null : mt.id)} title="選擇標籤顏色" style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,.9)', background: mt.color || '#E8A13C', cursor: 'pointer', padding: 0, boxShadow: '0 1px 4px rgba(0,0,0,.15)' }} />}
              <span style={{ fontSize: 13, fontWeight: 800, color: onColor ? '#fff' : chipColor }}>{mt.label}</span>
              <button aria-label={`刪除標籤「${mt.label}」`} className="tap" onClick={() => { if (confirm(`刪除標籤「${mt.label}」？`)) onDelete(mt.id); }} style={{ border: 'none', background: 'none', color: onColor ? 'rgba(255,255,255,.85)' : delColor, cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: 0, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={14} /></button>
            </div>
            {onColor && editingColorId === mt.id && (
              <ColorSwatches
                current={mt.color || '#E8A13C'}
                onPick={async (next) => { try { await onColor(mt.id, next); setEditingColorId(null); } catch (e) { alertError('更新顏色', e); } }}
              />
            )}
          </div>
        ))}
      </div>
      {setColor && <ColorSwatches current={color} onPick={setColor} compact />}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <input aria-label={placeholder} value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder} style={{ flex: 1, border: 'none', background: 'var(--surface-alt)', borderRadius: 12, padding: '10px 12px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }} />
        <button aria-label="新增" className="tap" onClick={onAdd} style={{ border: 'none', background: addBg, color: '#fff', fontWeight: 900, fontSize: 14, padding: '10px 16px', borderRadius: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}><Icon name="plus" size={14} /></button>
      </div>
    </div>
  );
}

function ColorSwatches({ current, onPick, compact = false }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: compact ? 10 : 6, marginBottom: compact ? 0 : 4 }}>
      {TAG_COLORS.map((hex) => (
        <button key={hex} onClick={() => onPick(hex)} title={hex}
          style={{ width: compact ? 24 : 22, height: compact ? 24 : 22, borderRadius: '50%', background: hex, border: hex === current ? '3px solid var(--text)' : '2px solid #fff', cursor: 'pointer', padding: 0, boxShadow: '0 1px 4px rgba(0,0,0,.15)' }} />
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

  if (linked) {
    return (
      <div style={{ border: 'none', background: 'var(--success-bg)', color: 'var(--success)', fontWeight: 800, fontSize: 13, padding: '10px 16px', borderRadius: 12 }}>
        ✅ 已連結 LINE 帳號
      </div>
    );
  }

  if (!canLinkLine()) return null;

  return (
    <>
      <button onClick={link} disabled={busy} style={{ border: 'none', background: 'var(--sunken)', color: '#06C755', fontWeight: 800, fontSize: 13, padding: '10px 16px', borderRadius: 12, cursor: 'pointer' }}>
        {busy ? '連結中…' : '🔗 連結 LINE 帳號'}
      </button>
      {msg === 'success' && <div style={{ width: '100%', marginTop: 8, fontSize: 13, color: 'var(--success)', background: 'var(--success-bg)', padding: '8px 12px', borderRadius: 10, fontWeight: 700 }}>已連結成功</div>}
      {msg && msg !== 'success' && <div style={{ width: '100%', marginTop: 8, fontSize: 13, color: 'var(--danger)', background: 'var(--danger-bg)', padding: '8px 12px', borderRadius: 10, fontWeight: 700 }}>{msg}</div>}
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

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ border: 'none', background: 'var(--sunken)', color: 'var(--text-muted)', fontWeight: 800, fontSize: 13, padding: '10px 16px', borderRadius: 12, cursor: 'pointer' }}>
        🔑 變更密碼
      </button>
    );
  }
  return (
    <div style={{ width: '100%' }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 6 }}>新密碼</div>
      <input aria-label="新密碼" type="password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={6} placeholder="至少 6 字元"
        style={{ width: '100%', border: 'none', background: 'var(--surface-alt)', borderRadius: 14, padding: '14px 15px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }} />
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <button onClick={save} disabled={busy} style={{ flex: 1, border: 'none', background: busy ? 'var(--line-strong)' : 'var(--primary)', color: '#fff', fontWeight: 900, fontSize: 14, padding: 12, borderRadius: 12, cursor: 'pointer' }}>{busy ? '更新中…' : '儲存新密碼'}</button>
        <button onClick={() => { setOpen(false); setPw(''); setMsg(''); }} style={{ flex: 1, border: 'none', background: 'var(--sunken)', color: 'var(--text-muted)', fontWeight: 800, fontSize: 14, padding: 12, borderRadius: 12, cursor: 'pointer' }}>取消</button>
      </div>
      {msg && <div style={{ marginTop: 10, fontSize: 13, color: msg === '密碼已更新' ? 'var(--success)' : 'var(--danger)', background: msg === '密碼已更新' ? 'var(--success-bg)' : 'var(--danger-bg)', padding: '8px 12px', borderRadius: 10, fontWeight: 700 }}>{msg}</div>}
    </div>
  );
}
