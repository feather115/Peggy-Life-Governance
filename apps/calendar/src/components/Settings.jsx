// 設定頁：帳號資訊（暱稱 + LINE 連結）+ 「管理分類與標籤」入口，之後有新設定選項可以加在這個清單裡。
import React, { useEffect, useState } from 'react';
import { THEME } from '../theme.js';
import { canLinkLine, checkLineLinked, linkLineAccount } from '../liff.js';
import { loadMyDisplayName, updateDisplayName } from '../db.js';

const S = {
  header: { display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: THEME.surface, borderBottom: `1px solid ${THEME.border}` },
  backBtn: { border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: THEME.textMuted, padding: '2px 6px', outline: 'none' },
  title: { fontSize: 17, fontWeight: 700, color: THEME.textDark },
  body: { padding: 20, display: 'flex', flexDirection: 'column', gap: 10 },
  row: { cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: THEME.surface, borderRadius: THEME.radiusSm, padding: '16px 18px', boxShadow: THEME.shadow },
  rowLabel: { fontSize: 15, fontWeight: 600, color: THEME.textDark },
  rowArrow: { fontSize: 15, color: THEME.textFaint },
  accountCard: { background: THEME.surface, borderRadius: THEME.radiusSm, padding: '16px 18px', boxShadow: THEME.shadow },
  accountLabel: { fontSize: 12, color: THEME.textMuted, marginBottom: 4 },
  accountEmail: { fontSize: 14, fontWeight: 700, color: THEME.textDark, marginBottom: 14, wordBreak: 'break-all' },
  linkedBadge: { display: 'inline-block', fontSize: 13, fontWeight: 700, color: THEME.success, background: THEME.successBg, padding: '9px 16px', borderRadius: THEME.radiusSmInner },
  linkBtn: { border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: THEME.primary, background: THEME.primarySoft, padding: '9px 16px', borderRadius: THEME.radiusSmInner },
  linkHint: { fontSize: 11, color: THEME.textFaint, marginTop: 8 },
  msgSuccess: { marginTop: 8, fontSize: 13, fontWeight: 700, color: THEME.success, background: THEME.successBg, padding: '8px 12px', borderRadius: THEME.radiusSmInner },
  msgError: { marginTop: 8, fontSize: 13, fontWeight: 700, color: THEME.error, background: THEME.errorBg, padding: '8px 12px', borderRadius: THEME.radiusSmInner },
  fieldLabel: { fontSize: 12, color: THEME.textMuted, marginTop: 14, marginBottom: 6 },
  nameRow: { display: 'flex', gap: 8 },
  nameInput: { flex: 1, boxSizing: 'border-box', border: `1px solid ${THEME.border}`, borderRadius: THEME.radiusSmInner, padding: '10px 12px', fontSize: 14, color: THEME.textDark, background: THEME.surface, outline: 'none' },
  nameSaveBtn: { border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff', background: THEME.primary, padding: '0 16px', borderRadius: THEME.radiusSmInner },
  nameHint: { fontSize: 11, color: THEME.textFaint, marginTop: 6 },
};

const LINE_LINKED_CACHE_KEY = 'calendar:line-linked';

// 顯示目前登入的 email/LINE 連結狀態，以及（只有在 LINE App 裡開啟時）「連結 LINE 帳號」按鈕。
// linked 狀態邏輯跟 calorie-tracker/recipe-book 的 LineLinker 一致：查到 true 就快取到
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
    return <div style={S.linkedBadge}>✅ 已連結 LINE 帳號</div>;
  }

  if (!canLinkLine()) return null;

  return (
    <>
      <button type="button" onClick={link} disabled={busy} style={S.linkBtn}>
        {busy ? '連結中…' : '🔗 連結 LINE 帳號'}
      </button>
      <div style={S.linkHint}>連結後，之後從 LINE 開啟會直接登入這個帳號</div>
      {msg === 'success' && <div style={S.msgSuccess}>已連結成功</div>}
      {msg && msg !== 'success' && <div style={S.msgError}>{msg}</div>}
    </>
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

  return (
    <>
      <div style={S.fieldLabel}>暱稱</div>
      <div style={S.nameRow}>
        <input
          type="text"
          style={S.nameInput}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="例如：小明"
          maxLength={20}
        />
        <button type="button" style={S.nameSaveBtn} onClick={save} disabled={busy || value.trim() === saved}>
          {busy ? '儲存中…' : '儲存'}
        </button>
      </div>
      <div style={S.nameHint}>跟 calorie-tracker、recipe-book 共用同一個暱稱</div>
      {msg === 'success' && <div style={S.msgSuccess}>已儲存</div>}
      {msg && msg !== 'success' && <div style={S.msgError}>{msg}</div>}
    </>
  );
}

export default function Settings({ session, onClose, onManageTags }) {
  const displayEmail = (() => {
    const email = session?.user?.email || '';
    if (email.endsWith('@line.invalid')) {
      const match = email.match(/^line-(U[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{4})@line\.invalid$/);
      return match ? `LINE: ${match[1]}...${match[2]}` : 'LINE 登入帳號';
    }
    return email;
  })();

  return (
    <div>
      <div style={S.header}>
        <button type="button" onClick={onClose} style={S.backBtn} aria-label="返回">←</button>
        <div style={S.title}>設定</div>
      </div>

      <div style={S.body}>
        <div style={S.accountCard}>
          <div style={S.accountLabel}>帳號</div>
          <div style={S.accountEmail}>{displayEmail}</div>
          <NicknameEditor userId={session?.user?.id} />
          <div style={{ marginTop: 14 }}>
            <LineLinker />
          </div>
        </div>

        <div style={S.row} onClick={onManageTags}>
          <div style={S.rowLabel}>管理分類與標籤</div>
          <div style={S.rowArrow}>›</div>
        </div>
      </div>
    </div>
  );
}
