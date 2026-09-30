// Settings tab: account email, nickname, LINE account linking, sign out.
import React, { useEffect, useState } from 'react';
import { canLinkLine, useLineLinked } from '../liff.js';
import OtherApps from '@peggy-life/shared/OtherApps.jsx';
import Icon from '@peggy-life/shared/Icon.jsx';

export default function SettingsTab({ session, myDisplayName, onSetDisplayName, onSignOut }) {
  const [nameInput, setNameInput] = useState(myDisplayName);
  const [nameBusy, setNameBusy] = useState(false);
  const [nameMsg, setNameMsg] = useState('');

  useEffect(() => { setNameInput(myDisplayName); }, [myDisplayName]);

  const displayEmail = (() => {
    const email = session?.user?.email || '';
    if (email.endsWith('@line.invalid')) {
      const match = email.match(/^line-(U[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{4})@line\.invalid$/);
      return match ? `LINE: ${match[1]}...${match[2]}` : 'LINE 登入帳號';
    }
    return email;
  })();

  const submitName = async () => {
    setNameBusy(true); setNameMsg('');
    try {
      await onSetDisplayName(nameInput);
      setNameMsg('success');
    } catch (e) {
      setNameMsg(e.message || '儲存失敗');
    } finally {
      setNameBusy(false);
    }
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

      <div style={{ background: 'var(--surface)', borderRadius: 24, padding: '20px 18px', marginTop: 14, boxShadow: 'var(--shadow-card)' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)', marginBottom: 14 }}>個人資料</div>

        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 6 }}>暱稱</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input aria-label="暱稱" type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="例如：小明" maxLength={20}
            style={{ flex: 1, border: 'none', background: 'var(--surface-alt)', borderRadius: 14, padding: '14px 15px', fontSize: 16, fontWeight: 800, color: 'var(--text)' }} />
          <button onClick={submitName} disabled={nameBusy || nameInput.trim() === myDisplayName}
            style={{ border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 900, fontSize: 14, padding: '0 18px', borderRadius: 14, cursor: 'pointer' }}>
            {nameBusy ? '儲存中…' : '儲存'}
          </button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 6, fontWeight: 600 }}>會顯示在「誰按讚」名單裡，沒設定就用 email 帳號名稱代替</div>
        {nameMsg === 'success' && <div style={{ marginTop: 8, fontSize: 13, color: 'var(--success)', background: 'var(--success-bg)', padding: '8px 12px', borderRadius: 10, fontWeight: 700 }}>已儲存</div>}
        {nameMsg && nameMsg !== 'success' && <div style={{ marginTop: 8, fontSize: 13, color: 'var(--danger)', background: 'var(--danger-bg)', padding: '8px 12px', borderRadius: 10, fontWeight: 700 }}>{nameMsg}</div>}

        <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <LineLinker />
        </div>
        {canLinkLine() && (
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 6, fontWeight: 600 }}>
            連結後，之後從 LINE 開啟會直接登入這個帳號
          </div>
        )}
      </div>
      <div style={{ marginTop: 12 }}><OtherApps current="recipe" /></div>
    </div>
  );
}

const LINE_LINKED_CACHE_KEY = 'recipe-book:line-linked';

// 連結狀態邏輯（含 localStorage 快取）在 @peggy-life/shared/lineAuth 的 useLineLinked，三個 app 共用，這裡只負責畫面。
function LineLinker() {
  const { linked, busy, msg, link } = useLineLinked(LINE_LINKED_CACHE_KEY);

  if (linked) {
    return (
      <div style={{ border: 'none', background: 'var(--success-bg)', color: 'var(--success)', fontWeight: 800, fontSize: 13, padding: '10px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="check-circle" size={16} />已連結 LINE 帳號
      </div>
    );
  }

  if (!canLinkLine()) return null;

  return (
    <>
      <button onClick={link} disabled={busy} style={{ border: 'none', background: 'var(--sunken)', color: 'var(--text)', fontWeight: 800, fontSize: 13, padding: '10px 16px', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
        {busy ? '連結中…' : <><Icon name="link" size={16} style={{ color: '#06C755' }} />連結 LINE 帳號</>}
      </button>
      {msg === 'success' && <div style={{ width: '100%', marginTop: 8, fontSize: 13, color: 'var(--success)', background: 'var(--success-bg)', padding: '8px 12px', borderRadius: 10, fontWeight: 700 }}>已連結成功</div>}
      {msg && msg !== 'success' && <div style={{ width: '100%', marginTop: 8, fontSize: 13, color: 'var(--danger)', background: 'var(--danger-bg)', padding: '8px 12px', borderRadius: 10, fontWeight: 700 }}>{msg}</div>}
    </>
  );
}
