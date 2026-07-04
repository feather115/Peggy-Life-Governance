// Settings tab: account email, nickname, LINE account linking, sign out.
import React, { useEffect, useState } from 'react';
import { canLinkLine, checkLineLinked, linkLineAccount } from '../liff.js';

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
          <div style={{ fontSize: 24, fontWeight: 900, color: '#3D281E', marginBottom: 4 }}>設定</div>
          <div style={{ fontSize: 14, color: '#8E7568', fontWeight: 700 }}>{displayEmail}</div>
        </div>
        <button onClick={onSignOut} style={{ border: 'none', background: '#F0E7E1', color: '#8E7568', fontWeight: 800, fontSize: 13, padding: '8px 14px', borderRadius: 14, cursor: 'pointer' }}>登出</button>
      </div>

      <div style={{ background: '#fff', borderRadius: 24, padding: '20px 18px', marginTop: 14, boxShadow: '0 10px 24px -18px rgba(232,122,36,.5)' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#3D281E', marginBottom: 14 }}>個人資料</div>

        <div style={{ fontSize: 14, fontWeight: 800, color: '#8E7568', marginBottom: 6 }}>暱稱</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="例如：小明" maxLength={20}
            style={{ flex: 1, border: 'none', background: '#FDF7F4', borderRadius: 14, padding: '14px 15px', fontSize: 16, fontWeight: 800, color: '#3D281E' }} />
          <button onClick={submitName} disabled={nameBusy || nameInput.trim() === myDisplayName}
            style={{ border: 'none', background: '#E87A24', color: '#fff', fontWeight: 900, fontSize: 14, padding: '0 18px', borderRadius: 14, cursor: 'pointer' }}>
            {nameBusy ? '儲存中…' : '儲存'}
          </button>
        </div>
        <div style={{ fontSize: 12, color: '#C5B4AC', marginTop: 6, fontWeight: 600 }}>會顯示在「誰按讚」名單裡，沒設定就用 email 帳號名稱代替</div>
        {nameMsg === 'success' && <div style={{ marginTop: 8, fontSize: 13, color: '#15803D', background: '#DCFCE7', padding: '8px 12px', borderRadius: 10, fontWeight: 700 }}>已儲存</div>}
        {nameMsg && nameMsg !== 'success' && <div style={{ marginTop: 8, fontSize: 13, color: '#B91C1C', background: '#FEE2E2', padding: '8px 12px', borderRadius: 10, fontWeight: 700 }}>{nameMsg}</div>}

        <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <LineLinker />
        </div>
        {canLinkLine() && (
          <div style={{ fontSize: 11, color: '#C5B4AC', marginTop: 6, fontWeight: 600 }}>
            連結後，之後從 LINE 開啟會直接登入這個帳號
          </div>
        )}
      </div>
    </div>
  );
}

const LINE_LINKED_CACHE_KEY = 'recipe-book:line-linked';

// 連結狀態邏輯跟 calorie-tracker/calendar 的 LineLinker 一致：查到 true 就快取到
// localStorage，重開 app 先用快取顯示「已連結」，避免查詢還沒回來、或暫時失敗時誤判成「沒連結」。
function LineLinker() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [linked, setLinked] = useState(() => {
    try {
      return localStorage.getItem(LINE_LINKED_CACHE_KEY) === '1' ? true : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let cancel = false;
    checkLineLinked().then((result) => {
      if (cancel || result === null) return;
      setLinked(result);
      try {
        if (result) localStorage.setItem(LINE_LINKED_CACHE_KEY, '1');
        else localStorage.removeItem(LINE_LINKED_CACHE_KEY);
      } catch {}
    });
    return () => { cancel = true; };
  }, []);

  const link = async () => {
    setBusy(true); setMsg('');
    try {
      await linkLineAccount();
      setLinked(true);
      try { localStorage.setItem(LINE_LINKED_CACHE_KEY, '1'); } catch {}
      setMsg('success');
    } catch (e) {
      setMsg(e.message || '連結失敗');
    } finally {
      setBusy(false);
    }
  };

  if (linked) {
    return (
      <div style={{ border: 'none', background: '#DCFCE7', color: '#15803D', fontWeight: 800, fontSize: 13, padding: '10px 16px', borderRadius: 12 }}>
        ✅ 已連結 LINE 帳號
      </div>
    );
  }

  if (!canLinkLine()) return null;

  return (
    <>
      <button onClick={link} disabled={busy} style={{ border: 'none', background: '#F0E7E1', color: '#06C755', fontWeight: 800, fontSize: 13, padding: '10px 16px', borderRadius: 12, cursor: 'pointer' }}>
        {busy ? '連結中…' : '🔗 連結 LINE 帳號'}
      </button>
      {msg === 'success' && <div style={{ width: '100%', marginTop: 8, fontSize: 13, color: '#15803D', background: '#DCFCE7', padding: '8px 12px', borderRadius: 10, fontWeight: 700 }}>已連結成功</div>}
      {msg && msg !== 'success' && <div style={{ width: '100%', marginTop: 8, fontSize: 13, color: '#B91C1C', background: '#FEE2E2', padding: '8px 12px', borderRadius: 10, fontWeight: 700 }}>{msg}</div>}
    </>
  );
}
