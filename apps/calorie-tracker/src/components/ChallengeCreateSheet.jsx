// Create new challenge / Join existing challenge using an invitation code
import React, { useState } from 'react';
import Sheet, { SheetHeader } from './Sheet.jsx';
import Icon from '@peggy-life/shared/Icon.jsx';
import { UI } from '@peggy-life/shared/ui';

const S = {
  tabs: { padding: '4px 20px 0' },
  body: { flex: 1, overflowY: 'auto', padding: '16px 20px 24px' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  cols: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 },
  hint: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 },
  code: { ...UI.input, textAlign: 'center', letterSpacing: 4, fontSize: 24, fontWeight: 600, minHeight: 56 },
};

export default function ChallengeCreateSheet({ onClose, onCreate, onJoin, repeatSource = null }) {
  const [tab, setTab] = useState('create'); // 'create' | 'join'

  return (
    <Sheet label="新增或加入挑戰" onBackdrop={onClose} height="min(72vh, 620px)" zIndex={15}>
      <SheetHeader title={repeatSource ? '原班人馬再來一局' : tab === 'create' ? '建立新挑戰' : '加入既有挑戰'} onClose={onClose} />

      {!repeatSource && (
        <div style={S.tabs}>
          <div style={UI.segTrack}>
            <button type="button" onClick={() => setTab('create')} aria-pressed={tab === 'create'} style={UI.seg(tab === 'create')}>建立</button>
            <button type="button" onClick={() => setTab('join')} aria-pressed={tab === 'join'} style={UI.seg(tab === 'join')}>加入</button>
          </div>
        </div>
      )}

      <div className="ps" style={S.body}>
        {tab === 'create' ? <CreateForm onCreate={onCreate} repeatSource={repeatSource} /> : <JoinForm onJoin={onJoin} />}
      </div>
    </Sheet>
  );
}

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
    <div style={S.form}>
      <label><span style={UI.fieldLabel}>挑戰名稱</span>
        <input aria-label="挑戰名稱" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：暑假甩肉大作戰" maxLength={40} style={UI.input} />
      </label>
      <div style={S.cols}>
        <label><span style={UI.fieldLabel}>開始日期</span>
          <input aria-label="開始日期" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={UI.input} />
        </label>
        <label><span style={UI.fieldLabel}>結束日期</span>
          <input aria-label="結束日期" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={UI.input} />
        </label>
      </div>
      {err && <div style={UI.note('danger')}>{err}</div>}
      <button type="button" onClick={submit} disabled={busy} style={{ ...UI.btnPrimary, width: '100%', opacity: busy ? 0.6 : 1 }}>{busy ? '建立中…' : repeatSource ? '建立新一局' : '建立挑戰'}</button>
      <div style={S.hint}>
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
    <div style={S.form}>
      <label><span style={UI.fieldLabel}>邀請碼</span>
        <input aria-label="邀請碼" type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="6 碼英數字" maxLength={6} style={S.code} />
      </label>
      {err && <div style={UI.note('danger')}>{err}</div>}
      <button type="button" onClick={submit} disabled={busy} style={{ ...UI.btnPrimary, width: '100%', opacity: busy ? 0.6 : 1 }}><Icon name="log-in" size={18} />{busy ? '加入中…' : '加入挑戰'}</button>
      <div style={S.hint}>請朋友把他建立挑戰時拿到的邀請碼給你。</div>
    </div>
  );
}
