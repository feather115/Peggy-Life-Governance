// Create new challenge / Join existing challenge using an invitation code
import React, { useState } from 'react';
import Sheet from './Sheet.jsx';

export default function ChallengeCreateSheet({ onClose, onCreate, onJoin }) {
  const [tab, setTab] = useState('create'); // 'create' | 'join'

  return (
    <Sheet onBackdrop={onClose} height="min(70vh, 600px)" zIndex={15}>
      <div style={{ padding: '8px 20px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#234034' }}>{tab === 'create' ? '建立新挑戰' : '加入既有挑戰'}</div>
        <button onClick={onClose} style={{ border: 'none', background: '#EAF5EE', color: '#6E8B7C', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 16, lineHeight: 1, fontWeight: 700 }}>×</button>
      </div>

      <div style={{ padding: '4px 16px 0' }}>
        <div style={{ display: 'flex', background: '#F0F3F1', borderRadius: 12, padding: 3, gap: 3 }}>
          <button onClick={() => setTab('create')} style={tabBtn(tab === 'create')}>＋ 建立</button>
          <button onClick={() => setTab('join')} style={tabBtn(tab === 'join')}>🔑 加入</button>
        </div>
      </div>

      <div className="ps" style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 24px' }}>
        {tab === 'create' ? <CreateForm onCreate={onCreate} /> : <JoinForm onJoin={onJoin} />}
      </div>
    </Sheet>
  );
}

const tabBtn = (active) => ({
  flex: 1, padding: 10, border: 'none', borderRadius: 10, cursor: 'pointer',
  fontSize: 14, fontWeight: 800, fontFamily: 'inherit',
  background: active ? '#fff' : 'transparent',
  color: active ? '#2E8B5E' : '#9bb0a3',
  boxShadow: active ? '0 2px 6px -2px rgba(46,139,94,.3)' : 'none',
});

function CreateForm({ onCreate }) {
  const today = new Date().toISOString().slice(0, 10);
  const inAMonth = new Date(); inAMonth.setMonth(inAMonth.getMonth() + 1);
  const defaultEnd = inAMonth.toISOString().slice(0, 10);
  const [name, setName] = useState('');
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
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：暑假甩肉大作戰" maxLength={40} style={input} />
      </Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="開始日期">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={input} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="結束日期">
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={input} />
          </Field>
        </div>
      </div>
      {err && <div style={errBox}>{err}</div>}
      <button onClick={submit} disabled={busy} style={{ ...primaryBtn, marginTop: 6, opacity: busy ? 0.6 : 1 }}>{busy ? '建立中…' : '建立挑戰'}</button>
      <div style={{ fontSize: 12, color: '#9bb0a3', fontWeight: 600, lineHeight: 1.7, marginTop: 4 }}>建立後會產生一組邀請碼，分享給朋友讓他們加入。</div>
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
        <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="6 碼英數字" maxLength={6}
          style={{ ...input, textAlign: 'center', letterSpacing: 4, fontSize: 22, fontWeight: 900 }} />
      </Field>
      {err && <div style={errBox}>{err}</div>}
      <button onClick={submit} disabled={busy} style={{ ...primaryBtn, marginTop: 6, opacity: busy ? 0.6 : 1 }}>{busy ? '加入中…' : '加入挑戰'}</button>
      <div style={{ fontSize: 12, color: '#9bb0a3', fontWeight: 600, lineHeight: 1.7, marginTop: 4 }}>請朋友把他建立挑戰時拿到的邀請碼給你。</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, color: '#6E8B7C', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

const input = { width: '100%', border: 'none', background: '#F6FAF7', borderRadius: 12, padding: '14px 15px', fontSize: 16, fontWeight: 700, color: '#234034' };
const primaryBtn = { border: 'none', background: '#2E8B5E', color: '#fff', fontWeight: 900, fontSize: 15, padding: 14, borderRadius: 14, cursor: 'pointer' };
const errBox = { background: '#FEE2E2', color: '#B91C1C', borderRadius: 10, padding: '10px 12px', fontSize: 13, fontWeight: 700 };
