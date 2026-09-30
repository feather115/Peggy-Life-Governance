// Settings tab: 分組清單（個人資料、其他 App、帳號）＋ 登出。三個 app 的設定頁用同一個版型。
import React, { useEffect, useState } from 'react';
import { canLinkLine, useLineLinked } from '../liff.js';
import OtherApps from '@peggy-life/shared/OtherApps.jsx';
import Icon from '@peggy-life/shared/Icon.jsx';
import { UI } from '@peggy-life/shared/ui';

const S = {
  page: { paddingBottom: 24 },
  group: { margin: '28px 20px 0', display: 'flex', flexDirection: 'column', gap: 8 },
  groupHint: { margin: 0, padding: '0 4px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 },
  rowLabel: { flex: 1, minWidth: 0, fontSize: 15 },
  nameInput: { ...UI.input, flex: 1, minWidth: 0, minHeight: 40 },
  rowNote: { padding: '0 16px 12px' },
  linked: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 500, color: 'var(--success-ink)' },
  signOut: { margin: '28px 20px 0' },
  footer: { margin: '16px 0 0', textAlign: 'center', fontSize: 12, color: 'var(--text-faint)' },
};

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

  const nameUnchanged = nameInput.trim() === myDisplayName;

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
          <div style={UI.row}>
            <label htmlFor="nickname" style={{ fontSize: 15, flexShrink: 0 }}>暱稱</label>
            <input id="nickname" type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="例如：小明" maxLength={20} style={S.nameInput} />
            <button type="button" onClick={submitName} disabled={nameBusy || nameUnchanged} style={{ ...UI.btnSecondary, opacity: nameBusy || nameUnchanged ? 0.5 : 1 }}>
              {nameBusy ? '儲存中…' : '儲存'}
            </button>
          </div>
          {nameMsg === 'success' && <div style={S.rowNote}><div style={UI.note('success')}>已儲存</div></div>}
          {nameMsg && nameMsg !== 'success' && <div style={S.rowNote}><div style={UI.note('danger')}>{nameMsg}</div></div>}
        </div>
        <p style={S.groupHint}>會顯示在「誰按讚」名單裡，沒設定就用 email 帳號名稱代替</p>
      </section>

      <OtherApps current="recipe" style={S.group} />

      <LineGroup />

      <div style={S.signOut}>
        <button type="button" onClick={onSignOut} style={{ ...UI.btnNeutral, width: '100%', minHeight: 48, fontSize: 15 }}>登出</button>
      </div>
      <p style={S.footer}>TY Recipe Book</p>
    </div>
  );
}

const LINE_LINKED_CACHE_KEY = 'recipe-book:line-linked';

// 連結狀態邏輯（含 localStorage 快取）在 @peggy-life/shared/lineAuth 的 useLineLinked，三個 app 共用，這裡只負責畫面。
function LineGroup() {
  const { linked, busy, msg, link } = useLineLinked(LINE_LINKED_CACHE_KEY);

  if (!linked && !canLinkLine()) return null;

  return (
    <section style={S.group}>
      <h2 style={UI.groupLabel}>帳號</h2>
      <div style={UI.listCard}>
        <div style={UI.row}>
          <Icon name="link" size={20} style={{ color: 'var(--text-muted)' }} />
          <span style={S.rowLabel}>LINE 帳號</span>
          {linked
            ? <span style={S.linked}><Icon name="check-circle" size={16} />已連結</span>
            : <button type="button" onClick={link} disabled={busy} style={{ ...UI.btnSecondary, minHeight: 36 }}>{busy ? '連結中…' : '連結'}</button>}
        </div>
        {!linked && msg === 'success' && <div style={S.rowNote}><div style={UI.note('success')}>已連結成功</div></div>}
        {!linked && msg && msg !== 'success' && <div style={S.rowNote}><div style={UI.note('danger')}>{msg}</div></div>}
      </div>
      {canLinkLine() && <p style={S.groupHint}>連結後，之後從 LINE 開啟會直接登入這個帳號</p>}
    </section>
  );
}
