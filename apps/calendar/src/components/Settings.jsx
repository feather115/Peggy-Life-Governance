// 設定頁：跟另外兩個 app 同一個分組清單版型——個人資料（暱稱）、管理（分類標籤、選項庫）、其他 App、帳號（LINE）、登出。
// 之後有新設定選項可以加在「管理」這組裡。
import React, { useEffect, useState } from 'react';
import { THEME } from '../theme.js';
import { canLinkLine, useLineLinked } from '../liff.js';
import { loadMyDisplayName, updateDisplayName } from '../db.js';
import Icon from '@peggy-life/shared/Icon.jsx';
import { UI } from '@peggy-life/shared/ui';
import OtherApps from '@peggy-life/shared/OtherApps.jsx';

const S = {
  page: { paddingBottom: 24 },
  headText: { flex: 1, minWidth: 0 },
  email: { ...UI.subtitle, margin: '2px 0 0', wordBreak: 'break-all' },
  group: { margin: '28px 20px 0', display: 'flex', flexDirection: 'column', gap: 8 },
  groupHint: { margin: 0, padding: '0 4px', fontSize: 13, color: THEME.textMuted, lineHeight: 1.5 },
  rowLabel: { flex: 1, minWidth: 0, fontSize: 15 },
  nameInput: { ...UI.input, flex: 1, minWidth: 0, minHeight: 40 },
  rowNote: { padding: '0 16px 12px' },
  linked: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 500, color: THEME.successInk },
  chevron: { color: THEME.textFaint },
  signOut: { margin: '28px 20px 0' },
  footer: { margin: '16px 0 0', textAlign: 'center', fontSize: 12, color: THEME.textFaint },
};

const LINE_LINKED_CACHE_KEY = 'calendar:line-linked';

// 顯示 LINE 連結狀態，以及（只有在 LINE App 裡開啟時）「連結」按鈕；兩者都不適用時整組不顯示。
// 連結狀態邏輯（含 localStorage 快取）在 @peggy-life/shared/lineAuth 的 useLineLinked，三個 app 共用，這裡只負責畫面。
function LineGroup() {
  const { linked, busy, msg, link } = useLineLinked(LINE_LINKED_CACHE_KEY);

  if (!linked && !canLinkLine()) return null;

  return (
    <section style={S.group}>
      <h2 style={UI.groupLabel}>帳號</h2>
      <div style={UI.listCard}>
        <div style={UI.row}>
          <Icon name="link" size={20} style={{ color: THEME.textMuted }} />
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

// 暱稱是跨 app 共用的（shared.user_profiles），在這裡改完 calorie-tracker/recipe-book
// 的設定頁會立刻看到同一個名字，反過來也一樣。
function NicknameEditor({ userId }) {
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let cancel = false;
    loadMyDisplayName(userId).then((name) => {
      if (cancel) return;
      setValue(name);
      setSaved(name);
    }).catch(() => {});
    return () => { cancel = true; };
  }, [userId]);

  const save = async () => {
    setBusy(true); setMsg('');
    try {
      await updateDisplayName(userId, value.trim());
      setSaved(value.trim());
      setMsg('success');
    } catch (e) {
      setMsg(e.message || '儲存失敗');
    } finally {
      setBusy(false);
    }
  };

  const unchanged = value.trim() === saved;

  return (
    <section style={S.group}>
      <h2 style={UI.groupLabel}>個人資料</h2>
      <div style={UI.listCard}>
        <div style={UI.row}>
          <label htmlFor="nickname" style={{ fontSize: 15, flexShrink: 0 }}>暱稱</label>
          <input id="nickname"
            type="text"
            style={S.nameInput}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="例如：小明"
            maxLength={20}
          />
          <button type="button" style={{ ...UI.btnSecondary, opacity: busy || unchanged ? 0.5 : 1 }} onClick={save} disabled={busy || unchanged}>
            {busy ? '儲存中…' : '儲存'}
          </button>
        </div>
        {msg === 'success' && <div style={S.rowNote}><div style={UI.note('success')}>已儲存</div></div>}
        {msg && msg !== 'success' && <div style={S.rowNote}><div style={UI.note('danger')}>{msg}</div></div>}
      </div>
      <p style={S.groupHint}>跟飲食卡路里、食譜本共用同一個暱稱</p>
    </section>
  );
}

export default function Settings({ session, onClose, onManageTags, onManageOptions, onSignOut }) {
  const displayEmail = (() => {
    const email = session?.user?.email || '';
    if (email.endsWith('@line.invalid')) {
      const match = email.match(/^line-(U[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{4})@line\.invalid$/);
      return match ? `LINE: ${match[1]}...${match[2]}` : 'LINE 登入帳號';
    }
    return email;
  })();

  return (
    <div style={S.page}>
      <header style={UI.subBar}>
        <button type="button" onClick={onClose} style={UI.iconBtn} aria-label="返回"><Icon name="chevron-left" size={20} /></button>
        <div style={S.headText}>
          <h1 style={UI.subTitle}>設定</h1>
          <p style={S.email}>{displayEmail}</p>
        </div>
      </header>

      <NicknameEditor userId={session?.user?.id} />

      <section style={S.group}>
        <h2 style={UI.groupLabel}>管理</h2>
        <div style={UI.listCard}>
          <button type="button" style={UI.row} onClick={onManageTags}>
            <Icon name="tag" size={20} style={{ color: THEME.textMuted }} />
            <span style={S.rowLabel}>日記分類與標籤</span>
            <Icon name="chevron-right" size={18} style={S.chevron} />
          </button>
          <div style={UI.divider} />
          <button type="button" style={UI.row} onClick={onManageOptions}>
            <Icon name="map-pin" size={20} style={{ color: THEME.textMuted }} />
            <span style={S.rowLabel}>地點、人名與事件標籤</span>
            <Icon name="chevron-right" size={18} style={S.chevron} />
          </button>
        </div>
      </section>

      <OtherApps current="calendar" style={S.group} />

      <LineGroup />

      {onSignOut && (
        <div style={S.signOut}>
          <button type="button" onClick={onSignOut} style={{ ...UI.btnNeutral, width: '100%', minHeight: 48, fontSize: 15 }}>登出</button>
        </div>
      )}
      <p style={S.footer}>TY Calendar</p>
    </div>
  );
}
