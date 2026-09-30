// Login / Sign Up / Forgot Password page (shown when not logged in). Supabase Email + Password.
import React, { useState } from 'react';
import { supabase } from '../supabase.js';
import { canLinkLine, retryLineAuthorization } from '../liff.js';
import Icon from '@peggy-life/shared/Icon.jsx';

export default function Auth({ lineDebug, onGuest }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgKind, setMsgKind] = useState('info'); // info | error | success
  const [authRetryBusy, setAuthRetryBusy] = useState(false);
  const [authRetryMsg, setAuthRetryMsg] = useState('');

  const setError = (m) => { setMsg(m); setMsgKind('error'); };
  const setSuccess = (m) => { setMsg(m); setMsgKind('success'); };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg('');
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess('註冊成功！可以直接登入了。');
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setSuccess('重設密碼信件已寄出，請查看信箱。點擊連結登入後到「設定」變更新密碼。');
      }
    } catch (err) {
      setError(err.message || '操作失敗');
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (m) => { setMode(m); setMsg(''); };

  const titles = {
    signin: '登入以查看你的食譜',
    signup: '建立新帳號',
    forgot: '輸入 Email，寄送重設連結',
  };
  const submitLabels = {
    signin: '登入', signup: '註冊', forgot: '寄出重設連結',
  };

  const msgStyles = {
    error:   { color: 'var(--danger-ink)', bg: 'var(--danger-bg)' },
    success: { color: 'var(--success-ink)', bg: 'var(--success-bg)' },
    info:    { color: 'var(--warning-ink)', bg: 'var(--warning-bg)' },
  };
  const ms = msgStyles[msgKind];

  // 把技術性的 lineDebug 原因轉成一般使用者看得懂的提示。
  // isInClient=false 只代表「不是在 LINE App 裡開的」，這是正常情況（純網頁瀏覽），不用特別提示。
  const isPermissionIssue = !!lineDebug && (lineDebug.includes('getIDToken') || lineDebug.includes('isLoggedIn'));
  const lineHint = (() => {
    if (!lineDebug || lineDebug.includes('isInClient=false')) return null;
    if (isPermissionIssue) {
      return '這次沒辦法用 LINE 自動登入，可能是還沒同意 LINE 的登入權限。可以點下面的按鈕重新申請授權，或改用 Email 登入。';
    }
    return 'LINE 自動登入暫時失敗了，請改用下面的 Email 登入，或稍後再試一次。';
  })();

  const handleRetryAuthorization = async () => {
    setAuthRetryBusy(true); setAuthRetryMsg('');
    try {
      const result = await retryLineAuthorization();
      if (result.alreadyGranted) {
        setAuthRetryMsg('已經是同意狀態了，如果還是無法登入請改用 Email，或聯絡我們協助排查。');
        setAuthRetryBusy(false);
        return;
      }
      // requestAll 同意後，LIFF 頁面必須重新整理才會拿到新的 idToken 並重新嘗試自動登入
      window.location.reload();
    } catch (e) {
      setAuthRetryMsg(e.message || '重新申請授權失敗，請改用 Email 登入');
      setAuthRetryBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 28, padding: 28, width: '100%', maxWidth: 380, boxShadow: 'var(--shadow-card)' }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', textAlign: 'center' }}>TY Recipe Book</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 700, textAlign: 'center', marginTop: 4, marginBottom: 20 }}>
          {titles[mode]}
        </div>
        {lineHint && (
          <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--warning-ink)', background: 'var(--warning-bg)', padding: '10px 12px', borderRadius: 14, fontWeight: 700, lineHeight: 1.6 }}>
            💬 {lineHint}
            {isPermissionIssue && canLinkLine() && (
              <button
                type="button"
                onClick={handleRetryAuthorization}
                disabled={authRetryBusy}
                style={{ display: 'block', width: '100%', marginTop: 10, border: 'none', background: '#06C755', color: '#fff', fontWeight: 900, fontSize: 13, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                {authRetryBusy ? '處理中…' : <><Icon name="refresh" size={15} />重新申請 LINE 授權</>}
              </button>
            )}
            {authRetryMsg && (
              <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: 'var(--warning-ink)' }}>{authRetryMsg}</div>
            )}
          </div>
        )}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input aria-label="Email" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
            style={{ border: 'none', background: 'var(--surface-alt)', borderRadius: 14, padding: '14px 16px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }} />
          {mode !== 'forgot' && (
            <input aria-label="密碼" type="password" placeholder="密碼（至少 6 字元）" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              style={{ border: 'none', background: 'var(--surface-alt)', borderRadius: 14, padding: '14px 16px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }} />
          )}
          <button type="submit" disabled={busy}
            style={{ border: 'none', background: busy ? 'var(--line-strong)' : 'var(--primary)', color: '#fff', fontWeight: 900, fontSize: 15, padding: 14, borderRadius: 14, cursor: 'pointer', marginTop: 6 }}>
            {busy ? '處理中…' : submitLabels[mode]}
          </button>
        </form>
        {msg && <div style={{ marginTop: 12, fontSize: 13, color: ms.color, background: ms.bg, padding: '10px 12px', borderRadius: 14, fontWeight: 700, lineHeight: 1.6 }}>{msg}</div>}

        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {mode === 'signin' && <>
            <button onClick={() => switchMode('signup')} style={linkBtn}>還沒有帳號？建立一個</button>
            <button onClick={() => switchMode('forgot')} style={linkBtn}>忘記密碼？</button>
          </>}
          {mode === 'signup' && (
            <button onClick={() => switchMode('signin')} style={linkBtn}>已有帳號？回到登入</button>
          )}
          {mode === 'forgot' && (
            <button onClick={() => switchMode('signin')} style={linkBtn}>‹ 回到登入</button>
          )}
        </div>
        {onGuest && (
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
            <button
              type="button"
              onClick={onGuest}
              style={{ width: '100%', border: 'none', background: 'var(--surface-alt)', color: 'var(--text)', fontWeight: 900, fontSize: 14, padding: 12, borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Icon name="eye" size={16} />以訪客身分瀏覽分享的食譜
            </button>
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-faint)', fontWeight: 700, textAlign: 'center', lineHeight: 1.5 }}>
              訪客只能看別人分享出來的食譜，無法新增、編輯，也沒有料理行事曆。
            </div>
          </div>
        )}
        {lineDebug && <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-faint)', fontWeight: 600, lineHeight: 1.6, wordBreak: 'break-word' }}>LINE 自動登入除錯：{lineDebug}</div>}
      </div>
    </div>
  );
}

const linkBtn = { width: '100%', border: 'none', background: 'none', color: 'var(--text-muted)', fontWeight: 800, fontSize: 14, cursor: 'pointer', padding: '6px 0' };
