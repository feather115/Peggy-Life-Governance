// 最外層：決定要顯示「設定缺失提示 / 登入頁 / 主程式」
// 監聽 Supabase 登入狀態，登入後把 session 傳給 App。
import React, { useState, useEffect } from 'react';
import { supabase, supabaseReady } from './supabase.js';
import { lineAutoLogin } from './liff.js';
import Auth from './components/Auth.jsx';
import App from './App.jsx';
import ConfigMissing from '@peggy-life/shared/ConfigMissing.jsx';

export default function Root() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [lineDebug, setLineDebug] = useState(''); // 暫時的診斷文字，定位 LINE 自動登入失敗原因用

  useEffect(() => {
    if (!supabaseReady) { setReady(true); return; }
    let cancel = false;
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) { if (!cancel) { setSession(data.session); setReady(true); } return; }
      // 還沒登入時，如果是在 LINE App 裡開的，先試試看用 LINE 身份自動登入
      const result = await lineAutoLogin();
      if (!result.ok && !cancel) setLineDebug(result.reason || '');
      const { data: data2 } = await supabase.auth.getSession();
      if (!cancel) { setSession(data2.session); setReady(true); }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => { cancel = true; sub.subscription.unsubscribe(); };
  }, []);

  if (!supabaseReady) return <ConfigMissing appName="飲食卡路里 App" />;
  if (!ready) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6E8B7C', fontWeight: 700 }}>初始化…</div>;
  if (!session) return <Auth lineDebug={lineDebug} />;
  return <App session={session} onSignOut={() => supabase.auth.signOut()} />;
}
