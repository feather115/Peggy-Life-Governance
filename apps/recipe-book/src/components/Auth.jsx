// Login / Sign Up / Forgot Password page (shown when not logged in). Supabase Email + Password. 三個 app 的登入頁同一個版型（這裡多了 LINE 授權提示與訪客模式）。
import React, { useState } from 'react';
import { supabase } from '../supabase.js';
import { canLinkLine, retryLineAuthorization } from '../liff.js';
import Icon from '@peggy-life/shared/Icon.jsx';
import { UI } from '@peggy-life/shared/ui';

const S = {
  wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { ...UI.card, padding: 24, width: '100%', maxWidth: 380 },
  title: { ...UI.title, textAlign: 'center' },
  sub: { fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4, marginBottom: 20 },
  lineHint: { ...UI.note('warning'), display: 'block', marginBottom: 16, fontWeight: 400, lineHeight: 1.6 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  links: { marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  link: { ...UI.btnText, color: 'var(--text-muted)' },
  guest: { marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' },
  guestHint: { marginTop: 8, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 },
  debug: { marginTop: 16, fontSize: 12, color: 'var(--text-faint)', lineHeight: 1.6, wordBreak: 'break-word' },
};

const MSG_TONE = { error: 'danger', success: 'success', info: 'warning' };

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
    <div style={S.wrap}>
      <div style={S.card}>
        <h1 style={S.title}>TY Recipe Book</h1>
        <div style={S.sub}>{titles[mode]}</div>
        {lineHint && (
          <div style={S.lineHint}>
            {lineHint}
            {isPermissionIssue && canLinkLine() && (
              <button type="button" onClick={handleRetryAuthorization} disabled={authRetryBusy} style={{ ...UI.btnNeutral, width: '100%', marginTop: 10, background: 'var(--surface)' }}>
                {authRetryBusy ? '處理中…' : <><Icon name="refresh" size={16} />重新申請 LINE 授權</>}
              </button>
            )}
            {authRetryMsg && <div style={{ marginTop: 8, fontSize: 13 }}>{authRetryMsg}</div>}
          </div>
        )}
        <form onSubmit={submit} style={S.form}>
          <label>
            <span style={UI.fieldLabel}>電子郵件</span>
            <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={UI.input} />
          </label>
          {mode !== 'forgot' && (
            <label>
              <span style={UI.fieldLabel}>密碼</span>
              <input type="password" placeholder="至少 6 字元" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={UI.input} />
            </label>
          )}
          <button type="submit" disabled={busy} style={{ ...UI.btnPrimary, marginTop: 4, opacity: busy ? 0.6 : 1 }}>
            {busy ? '處理中…' : submitLabels[mode]}
          </button>
        </form>
        {msg && <div style={{ ...UI.note(MSG_TONE[msgKind]), marginTop: 12 }}>{msg}</div>}

        <div style={S.links}>
          {mode === 'signin' && <>
            <button type="button" onClick={() => switchMode('signup')} style={S.link}>還沒有帳號？建立一個</button>
            <button type="button" onClick={() => switchMode('forgot')} style={S.link}>忘記密碼？</button>
          </>}
          {mode === 'signup' && (
            <button type="button" onClick={() => switchMode('signin')} style={S.link}>已有帳號？回到登入</button>
          )}
          {mode === 'forgot' && (
            <button type="button" onClick={() => switchMode('signin')} style={S.link}>回到登入</button>
          )}
        </div>
        {onGuest && (
          <div style={S.guest}>
            <button type="button" onClick={onGuest} style={{ ...UI.btnNeutral, width: '100%', minHeight: 44 }}>
              <Icon name="eye" size={16} />以訪客身分瀏覽分享的食譜
            </button>
            <div style={S.guestHint}>訪客只能看別人分享出來的食譜，無法新增、編輯，也沒有料理行事曆。</div>
          </div>
        )}
        {lineDebug && <div style={S.debug}>LINE 自動登入除錯：{lineDebug}</div>}
      </div>
    </div>
  );
}
