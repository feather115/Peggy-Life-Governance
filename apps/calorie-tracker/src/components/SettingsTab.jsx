// Settings tab: account/sign out, profile (nickname + change password), daily goal, tags management, data clearing
import React, { useState } from 'react';
import { FOODS } from '../constants.js';
import { totalRecordedDays } from '../selectors.js';
import { supabase } from '../supabase.js';
import { canLinkLine, linkLineAccount } from '../liff.js';

const TAG_COLORS = ['#E8A13C', '#D9544F', '#EC4899', '#8B5CF6', '#4361EE', '#5FA8D3', '#14B8A6', '#2E8B5E'];

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
    { label: '蛋白質 (g)', color: '#2E8B5E', val: goalP, set: setGoalP },
    { label: '碳水 (g)', color: '#E8A13C', val: goalC, set: setGoalC },
    { label: '脂肪 (g)', color: '#5FA8D3', val: goalF, set: setGoalF },
  ];

  const submitFasting = async () => {
    const label = addFastingInput.trim();
    if (!label) return;
    await addTagDef('fasting', label);
    setAddFastingInput('');
  };
  const submitOther = async () => {
    const label = addOtherInput.trim();
    if (!label) return;
    await addTagDef('other', label, addOtherColor);
    setAddOtherInput('');
  };
  const doClear = async () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    if (!confirm('⚠️ 警告：確定要清除所有的飲食紀錄與自訂食物嗎？這個動作將會刪除所有歷史資料，且無法復原！')) {
      setConfirmClear(false);
      return;
    }
    await clearAll();
    setConfirmClear(false);
  };

  return (
    <div style={{ padding: '6px 18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#234034', marginBottom: 4 }}>設定</div>
          <div style={{ fontSize: 14, color: '#6E8B7C', fontWeight: 700 }}>{displayEmail}</div>
        </div>
        <button onClick={onSignOut} style={{ border: 'none', background: '#F0F3F1', color: '#6E8B7C', fontWeight: 800, fontSize: 13, padding: '8px 14px', borderRadius: 14, cursor: 'pointer' }}>登出</button>
      </div>

      {/* Personal Profile */}
      <div style={{ background: '#fff', borderRadius: 24, padding: '20px 18px', marginTop: 14, boxShadow: '0 10px 24px -18px rgba(46,139,94,.5)' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#234034', marginBottom: 14 }}>個人資料</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#6E8B7C', marginBottom: 6 }}>暱稱</div>
        <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="例如：小明" maxLength={20}
          style={{ width: '100%', border: 'none', background: '#F6FAF7', borderRadius: 14, padding: '14px 15px', fontSize: 16, fontWeight: 800, color: '#234034' }} />
        <div style={{ fontSize: 12, color: '#9bb0a3', marginTop: 6, fontWeight: 600 }}>會顯示在紀錄頁的問候語</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start', marginTop: 14 }}>
          <PasswordChanger />
          <LineLinker />
        </div>
        {canLinkLine() && (
          <div style={{ fontSize: 11, color: '#9bb0a3', marginTop: 6, fontWeight: 600 }}>
            連結後，之後從 LINE 開啟會直接登入這個帳號
          </div>
        )}
      </div>

      {/* Daily Goals */}
      <div style={{ background: '#fff', borderRadius: 24, padding: '20px 18px', marginTop: 14, boxShadow: '0 10px 24px -18px rgba(46,139,94,.5)' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#234034', marginBottom: 14 }}>每日目標</div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#6E8B7C', marginBottom: 6 }}>卡路里 (kcal)</div>
          <input type="number" value={goalCal} onChange={(e) => { const n = parseInt(e.target.value); if (!isNaN(n) && n >= 0) setGoalCal(n); }} step="50" min="800" max="4000" style={{ width: '100%', border: 'none', background: '#F6FAF7', borderRadius: 14, padding: '14px 15px', fontSize: 20, fontWeight: 900, color: '#234034' }} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {goals.map((g) => (
            <div key={g.label} style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: g.color, marginBottom: 6 }}>{g.label}</div>
              <input type="number" value={g.val} onChange={(e) => { const n = parseInt(e.target.value); if (!isNaN(n) && n >= 0) g.set(n); }} step="5" min="0" style={{ width: '100%', border: 'none', background: '#F6FAF7', borderRadius: 14, padding: 12, fontSize: 16, fontWeight: 800, color: '#234034' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Tag Management */}
      <div style={{ background: '#fff', borderRadius: 24, padding: '20px 18px', marginTop: 12, boxShadow: '0 10px 24px -18px rgba(46,139,94,.5)' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#234034', marginBottom: 16 }}>標籤管理</div>
        <TagGroup title="⏱ 斷食標籤" titleColor="#4361EE" chipBg="#E8EDFF" chipColor="#4361EE" delColor="#8899DD"
          tags={fastingTagDefs} onDelete={(id) => deleteTagDef('fasting', id)}
          input={addFastingInput} setInput={setAddFastingInput} onAdd={submitFasting} addBg="#4361EE" placeholder="新增斷食標籤…" />
        <div style={{ height: 20 }} />
        <TagGroup title="🏷 記錄原因標籤" titleColor="#C4780A" chipBg="#FFF3DC" chipColor="#8B5A00" delColor="#D4923E"
          tags={otherTagDefs} onDelete={(id) => deleteTagDef('other', id)}
          onColor={(id, color) => updateTagColor('other', id, color)}
          input={addOtherInput} setInput={setAddOtherInput} onAdd={submitOther} addBg={addOtherColor} placeholder="新增標籤（如：聚餐、旅行）…"
          color={addOtherColor} setColor={setAddOtherColor} />
      </div>

      {/* Data Management */}
      <div style={{ background: '#fff', borderRadius: 24, padding: '20px 18px', marginTop: 12, boxShadow: '0 10px 24px -18px rgba(46,139,94,.5)' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#234034', marginBottom: 6 }}>資料管理</div>
        <div style={{ fontSize: 13, color: '#6E8B7C', fontWeight: 700, marginBottom: 14 }}>已記錄 {totalRec} 天 · 食物庫 {FOODS.length} + {customFoods.length} 自訂</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {!confirmClear && <button onClick={doClear} style={{ flex: 1, border: 'none', background: '#F0F3F1', color: '#D9544F', fontWeight: 800, fontSize: 14, padding: 14, borderRadius: 16, cursor: 'pointer' }}>清除全部</button>}
          {confirmClear && <>
            <button onClick={doClear} style={{ flex: 1, border: 'none', background: '#D9544F', color: '#fff', fontWeight: 800, fontSize: 14, padding: 14, borderRadius: 16, cursor: 'pointer' }}>確定清除</button>
            <button onClick={() => setConfirmClear(false)} style={{ flex: 1, border: 'none', background: '#F0F3F1', color: '#6E8B7C', fontWeight: 800, fontSize: 14, padding: 14, borderRadius: 16, cursor: 'pointer' }}>取消</button>
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
              <button onClick={() => onDelete(mt.id)} style={{ border: 'none', background: 'none', color: onColor ? 'rgba(255,255,255,.85)' : delColor, cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: 0, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            {onColor && editingColorId === mt.id && (
              <ColorSwatches
                current={mt.color || '#E8A13C'}
                onPick={async (next) => { await onColor(mt.id, next); setEditingColorId(null); }}
              />
            )}
          </div>
        ))}
      </div>
      {setColor && <ColorSwatches current={color} onPick={setColor} compact />}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder} style={{ flex: 1, border: 'none', background: '#F6FAF7', borderRadius: 12, padding: '10px 12px', fontSize: 16, fontWeight: 700, color: '#234034' }} />
        <button onClick={onAdd} style={{ border: 'none', background: addBg, color: '#fff', fontWeight: 900, fontSize: 14, padding: '10px 16px', borderRadius: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>＋</button>
      </div>
    </div>
  );
}

function ColorSwatches({ current, onPick, compact = false }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: compact ? 10 : 6, marginBottom: compact ? 0 : 4 }}>
      {TAG_COLORS.map((hex) => (
        <button key={hex} onClick={() => onPick(hex)} title={hex}
          style={{ width: compact ? 24 : 22, height: compact ? 24 : 22, borderRadius: '50%', background: hex, border: hex === current ? '3px solid #234034' : '2px solid #fff', cursor: 'pointer', padding: 0, boxShadow: '0 1px 4px rgba(0,0,0,.15)' }} />
      ))}
    </div>
  );
}

// Link LINE Account: Only shown when opened within the LINE App. Once linked, opening from LINE will log in to this account directly.
function LineLinker() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  if (!canLinkLine()) return null;

  const link = async () => {
    setBusy(true); setMsg('');
    try {
      await linkLineAccount();
      setMsg('success');
    } catch (e) {
      setMsg(e.message || '連結失敗');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button onClick={link} disabled={busy} style={{ border: 'none', background: '#F0F3F1', color: '#06C755', fontWeight: 800, fontSize: 13, padding: '10px 16px', borderRadius: 12, cursor: 'pointer' }}>
        {busy ? '連結中…' : '🔗 連結 LINE 帳號'}
      </button>
      {msg === 'success' && <div style={{ width: '100%', marginTop: 8, fontSize: 13, color: '#15803D', background: '#DCFCE7', padding: '8px 12px', borderRadius: 10, fontWeight: 700 }}>已連結成功</div>}
      {msg && msg !== 'success' && <div style={{ width: '100%', marginTop: 8, fontSize: 13, color: '#B91C1C', background: '#FEE2E2', padding: '8px 12px', borderRadius: 10, fontWeight: 700 }}>{msg}</div>}
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
      <button onClick={() => setOpen(true)} style={{ border: 'none', background: '#F0F3F1', color: '#6E8B7C', fontWeight: 800, fontSize: 13, padding: '10px 16px', borderRadius: 12, cursor: 'pointer' }}>
        🔑 變更密碼
      </button>
    );
  }
  return (
    <div style={{ width: '100%' }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#6E8B7C', marginBottom: 6 }}>新密碼</div>
      <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={6} placeholder="至少 6 字元"
        style={{ width: '100%', border: 'none', background: '#F6FAF7', borderRadius: 14, padding: '14px 15px', fontSize: 16, fontWeight: 700, color: '#234034' }} />
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <button onClick={save} disabled={busy} style={{ flex: 1, border: 'none', background: busy ? '#C7D6CC' : '#2E8B5E', color: '#fff', fontWeight: 900, fontSize: 14, padding: 12, borderRadius: 12, cursor: 'pointer' }}>{busy ? '更新中…' : '儲存新密碼'}</button>
        <button onClick={() => { setOpen(false); setPw(''); setMsg(''); }} style={{ flex: 1, border: 'none', background: '#F0F3F1', color: '#6E8B7C', fontWeight: 800, fontSize: 14, padding: 12, borderRadius: 12, cursor: 'pointer' }}>取消</button>
      </div>
      {msg && <div style={{ marginTop: 10, fontSize: 13, color: msg === '密碼已更新' ? '#15803D' : '#B91C1C', background: msg === '密碼已更新' ? '#DCFCE7' : '#FEE2E2', padding: '8px 12px', borderRadius: 10, fontWeight: 700 }}>{msg}</div>}
    </div>
  );
}
