// 登入 / 註冊 / 忘記密碼頁面（未登入時顯示）。Supabase Email + Password。
import React, { useState } from 'react';
import { supabase } from '../supabase.js';

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
    signin: '登入以查看你的行事曆',
    signup: '建立新帳號',
    forgot: '輸入 Email，寄送重設連結',
  };
  const submitLabels = {
    signin: '登入', signup: '註冊', forgot: '寄出重設連結',
  };

  const msgStyles = {
    error:   { color: '#B91C1C', bg: '#FEE2E2' },
    success: { color: '#15803D', bg: '#DCFCE7' },
    info:    { color: '#8B5A00', bg: '#FFF6E6' },
  };
  const ms = msgStyles[msgKind];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 28, padding: 28, width: '100%', maxWidth: 380, boxShadow: '0 20px 50px -20px rgba(74,111,165,.25)' }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#233A5E', textAlign: 'center' }}>TY Calendar</div>
        <div style={{ fontSize: 14, color: '#4A6FA5', fontWeight: 700, textAlign: 'center', marginTop: 4, marginBottom: 20 }}>
          {titles[mode]}
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
            style={{ border: 'none', background: '#F5F7FA', borderRadius: 14, padding: '14px 16px', fontSize: 16, fontWeight: 700, color: '#233A5E' }} />
          {mode !== 'forgot' && (
            <input type="password" placeholder="密碼（至少 6 字元）" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              style={{ border: 'none', background: '#F5F7FA', borderRadius: 14, padding: '14px 16px', fontSize: 16, fontWeight: 700, color: '#233A5E' }} />
          )}
          <button type="submit" disabled={busy}
            style={{ border: 'none', background: busy ? '#C7D2E0' : '#4A6FA5', color: '#fff', fontWeight: 900, fontSize: 15, padding: 14, borderRadius: 14, cursor: 'pointer', marginTop: 6, outline: 'none' }}>
            {busy ? '處理中…' : submitLabels[mode]}
          </button>
        </form>
        {msg && <div style={{ marginTop: 12, fontSize: 13, color: ms.color, background: ms.bg, padding: '10px 12px', borderRadius: 12, fontWeight: 700, lineHeight: 1.6 }}>{msg}</div>}

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
        {lineDebug && <div style={{ marginTop: 16, fontSize: 11, color: '#A9B4C6', fontWeight: 600, lineHeight: 1.6, wordBreak: 'break-word' }}>LINE 自動登入除錯：{lineDebug}</div>}
      </div>
    </div>
  );
}

const linkBtn = { width: '100%', border: 'none', background: 'none', color: '#4A6FA5', fontWeight: 800, fontSize: 14, cursor: 'pointer', padding: '6px 0', outline: 'none' };
