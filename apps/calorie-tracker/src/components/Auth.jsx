// Login / Sign Up / Forgot Password page (shown when not logged in). Supabase Email + Password. 三個 app 的登入頁同一個版型。
import React, { useState } from 'react';
import { supabase } from '../supabase.js';
import { UI } from '@peggy-life/shared/ui';

const S = {
  wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { ...UI.card, padding: 24, width: '100%', maxWidth: 380 },
  title: { ...UI.title, textAlign: 'center' },
  sub: { fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4, marginBottom: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  links: { marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  link: { ...UI.btnText, color: 'var(--text-muted)' },
  debug: { marginTop: 16, fontSize: 12, color: 'var(--text-faint)', lineHeight: 1.6, wordBreak: 'break-word' },
};

const MSG_TONE = { error: 'danger', success: 'success', info: 'warning' };

export default function Auth({ lineDebug }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgKind, setMsgKind] = useState('info'); // info | error | success

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
    signin: '登入以同步你的紀錄',
    signup: '建立新帳號',
    forgot: '輸入 Email，寄送重設連結',
  };
  const submitLabels = {
    signin: '登入', signup: '註冊', forgot: '寄出重設連結',
  };

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <h1 style={S.title}>TY Calorie Tracker</h1>
        <div style={S.sub}>{titles[mode]}</div>
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
        {lineDebug && <div style={S.debug}>LINE 自動登入除錯：{lineDebug}</div>}
      </div>
    </div>
  );
}
