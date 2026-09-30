// Create new challenge / Join existing challenge using an invitation code
import React, { useState } from 'react';
import Sheet from './Sheet.jsx';
import Icon from '@peggy-life/shared/Icon.jsx';

export default function ChallengeCreateSheet({ onClose, onCreate, onJoin, repeatSource = null }) {
  const [tab, setTab] = useState('create'); // 'create' | 'join'

  return (
    <Sheet label="新增或加入挑戰" onBackdrop={onClose} height="min(70vh, 600px)" zIndex={15}>
      <div style={{ padding: '8px 20px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)' }}>{repeatSource ? '原班人馬再來一局' : tab === 'create' ? '建立新挑戰' : '加入既有挑戰'}</div>
        <button aria-label="關閉" className="tap" onClick={onClose} style={{ border: 'none', background: 'var(--bg)', color: 'var(--text-muted)', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 16, lineHeight: 1, fontWeight: 700 }}><Icon name="x" size={14} /></button>
      </div>

      {!repeatSource && (
        <div style={{ padding: '4px 16px 0' }}>
          <div style={{ display: 'flex', background: 'var(--sunken)', borderRadius: 14, padding: 3, gap: 3 }}>
            <button onClick={() => setTab('create')} aria-pressed={tab === 'create'} style={tabBtn(tab === 'create')}><Icon name="plus" size={15} />建立</button>
            <button onClick={() => setTab('join')} aria-pressed={tab === 'join'} style={tabBtn(tab === 'join')}><Icon name="log-in" size={15} />加入</button>
          </div>
        </div>
      )}

      <div className="ps" style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 24px' }}>
        {tab === 'create' ? <CreateForm onCreate={onCreate} repeatSource={repeatSource} /> : <JoinForm onJoin={onJoin} />}
      </div>
    </Sheet>
  );
}

const tabBtn = (active) => ({
  flex: 1, padding: 10, border: 'none', borderRadius: 10, cursor: 'pointer',
  fontSize: 14, fontWeight: 800, fontFamily: 'inherit',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
  background: active ? 'var(--surface)' : 'transparent',
  color: active ? 'var(--primary-ink)' : 'var(--text-faint)',
  boxShadow: active ? 'var(--shadow-card)' : 'none',
});

function CreateForm({ onCreate, repeatSource }) {
  const today = new Date().toISOString().slice(0, 10);
  const inAMonth = new Date(); inAMonth.setMonth(inAMonth.getMonth() + 1);
  let defaultEnd = inAMonth.toISOString().slice(0, 10);
  if (repeatSource) {
    const duration = Math.max(1, Math.round((new Date(repeatSource.endDate) - new Date(repeatSource.startDate)) / 86400000));
    const repeatedEnd = new Date(today);
    repeatedEnd.setUTCDate(repeatedEnd.getUTCDate() + duration);
    defaultEnd = repeatedEnd.toISOString().slice(0, 10);
  }
  const repeatSuffix = ' 再來一局';
  const defaultName = repeatSource ? `${repeatSource.name.slice(0, 40 - repeatSuffix.length)}${repeatSuffix}` : '';
  const [name, setName] = useState(defaultName);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (!name.trim()) { setErr('請填挑戰名稱'); return; }
    if (new Date(endDate) <= new Date(startDate)) { setErr('結束日期要在開始之後'); return; }
    setBusy(true); setErr('');
    try {
      await onCreate({ name: name.trim(), startDate, endDate });
    } catch (e) {
      setErr(e.message || '建立失敗');
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Field label="挑戰名稱">
        <input aria-label="挑戰名稱" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：暑假甩肉大作戰" maxLength={40} style={input} />
      </Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="開始日期">
            <input aria-label="開始日期" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={input} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="結束日期">
            <input aria-label="結束日期" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={input} />
          </Field>
        </div>
      </div>
      {err && <div style={errBox}>{err}</div>}
      <button onClick={submit} disabled={busy} style={{ ...primaryBtn, marginTop: 6, opacity: busy ? 0.6 : 1 }}>{busy ? '建立中…' : repeatSource ? '建立新一局' : '建立挑戰'}</button>
      <div style={{ fontSize: 12, color: 'var(--text-faint)', fontWeight: 600, lineHeight: 1.7, marginTop: 4 }}>
        {repeatSource ? `建立後，上一局的 ${repeatSource.members.length} 位成員會直接加入新局。` : '建立後會產生一組邀請碼，分享給朋友讓他們加入。'}
      </div>
    </div>
  );
}

function JoinForm({ onJoin }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (code.trim().length < 4) { setErr('請輸入邀請碼'); return; }
    setBusy(true); setErr('');
    try {
      await onJoin(code.trim().toUpperCase());
    } catch (e) {
      setErr(e.message || '加入失敗');
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Field label="邀請碼">
        <input aria-label="邀請碼" type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="6 碼英數字" maxLength={6}
          style={{ ...input, textAlign: 'center', letterSpacing: 4, fontSize: 24, fontWeight: 900 }} />
      </Field>
      {err && <div style={errBox}>{err}</div>}
      <button onClick={submit} disabled={busy} style={{ ...primaryBtn, marginTop: 6, opacity: busy ? 0.6 : 1 }}>{busy ? '加入中…' : '加入挑戰'}</button>
      <div style={{ fontSize: 12, color: 'var(--text-faint)', fontWeight: 600, lineHeight: 1.7, marginTop: 4 }}>請朋友把他建立挑戰時拿到的邀請碼給你。</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

const input = { width: '100%', border: 'none', background: 'var(--surface-alt)', borderRadius: 14, padding: '14px 15px', fontSize: 16, fontWeight: 700, color: 'var(--text)' };
const primaryBtn = { border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 900, fontSize: 15, padding: 14, borderRadius: 14, cursor: 'pointer' };
const errBox = { background: 'var(--danger-bg)', color: 'var(--danger-ink)', borderRadius: 10, padding: '10px 12px', fontSize: 13, fontWeight: 700 };
