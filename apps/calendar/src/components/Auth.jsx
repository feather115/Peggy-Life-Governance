// 登入 / 註冊 / 忘記密碼頁面（未登入時顯示）。Supabase Email + Password。
import React, { useState } from 'react';
import { supabase } from '../supabase.js';
import { THEME } from '../theme.js';

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
        setSuccess('重設密碼信件已寄出，請查看信箱。點擊連結登入後再重新設定密碼。');
      }
    } catch (err) {
      setError(err.message || '操作失敗');
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (m) => { setMode(m); setMsg(''); };

  const titles = {
    signin: '登入你的行事曆',
    signup: '建立新帳號',
    forgot: '重設密碼',
  };
  const submitLabels = {
    signin: '登入', signup: '建立帳號', forgot: '寄送重設信件',
  };

  const msgStyles = {
    error:   { color: THEME.error, bg: THEME.errorBg },
    success: { color: THEME.success, bg: THEME.successBg },
    info:    { color: '#8B5A00', bg: '#FFF6E6' },
  };
  const ms = msgStyles[msgKind];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, background: THEME.bg }}>
      <div style={{ width: 52, height: 52, borderRadius: 16, background: THEME.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>TY</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: THEME.textDark, marginBottom: 4 }}>TY Calendar</div>
      <div style={{ fontSize: 14, color: THEME.textMuted, marginBottom: 28 }}>{titles[mode]}</div>

      <div style={{ width: '100%', maxWidth: 380, background: THEME.surface, borderRadius: THEME.radius, padding: 24, boxShadow: THEME.shadow }}>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: THEME.textMuted, marginBottom: 6 }}>電子郵件</div>
            <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required
              style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${THEME.border}`, borderRadius: THEME.radiusSm, padding: '11px 12px', fontSize: 15, color: THEME.textDark, background: THEME.surface, outline: 'none' }} />
          </div>
          {mode !== 'forgot' && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: THEME.textMuted, marginBottom: 6 }}>密碼</div>
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${THEME.border}`, borderRadius: THEME.radiusSm, padding: '11px 12px', fontSize: 15, color: THEME.textDark, background: THEME.surface, outline: 'none' }} />
            </div>
          )}
          <button type="submit" disabled={busy}
            style={{ width: '100%', border: 'none', cursor: 'pointer', padding: 12, borderRadius: THEME.radiusSm, background: THEME.primary, color: '#fff', fontSize: 15, fontWeight: 600, marginBottom: 12, outline: 'none' }}>
            {busy ? '處理中…' : submitLabels[mode]}
          </button>
        </form>
        {msg && <div style={{ fontSize: 13, color: ms.color, background: ms.bg, borderRadius: THEME.radiusSm, padding: '8px 10px', marginBottom: 14 }}>{msg}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          {mode === 'signin' && (
            <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
              <span onClick={() => switchMode('signup')} style={{ color: THEME.primary, cursor: 'pointer', fontWeight: 600 }}>建立新帳號</span>
              <span onClick={() => switchMode('forgot')} style={{ color: THEME.textMuted, cursor: 'pointer' }}>忘記密碼？</span>
            </div>
          )}
          {mode === 'signup' && (
            <span onClick={() => switchMode('signin')} style={{ color: THEME.primary, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>已經有帳號？登入</span>
          )}
          {mode === 'forgot' && (
            <span onClick={() => switchMode('signin')} style={{ color: THEME.primary, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>返回登入</span>
          )}
        </div>
        {lineDebug && <div style={{ marginTop: 16, fontSize: 11, color: THEME.textFaint, fontWeight: 600, lineHeight: 1.6, wordBreak: 'break-word' }}>LINE 自動登入除錯：{lineDebug}</div>}
      </div>
    </div>
  );
}
