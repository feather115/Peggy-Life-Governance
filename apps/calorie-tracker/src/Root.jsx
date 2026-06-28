// 最外層：決定要顯示「設定缺失提示 / 登入頁 / 主程式」
// 監聽 Supabase 登入狀態，登入後把 session 傳給 App。
import React, { useState, useEffect } from 'react';
import { supabase, supabaseReady } from './supabase.js';
import { lineAutoLogin } from './liff.js';
import Auth from './components/Auth.jsx';
import App from './App.jsx';

// 沒填 .env 時的提示畫面
function ConfigMissing() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 480, boxShadow: '0 16px 40px -20px rgba(0,0,0,.15)' }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#234034' }}>需要 Supabase 設定</div>
        <div style={{ fontSize: 13, color: '#6E8B7C', marginTop: 8, lineHeight: 1.7, fontWeight: 600 }}>
          請在專案根目錄建立 <code style={{ background: '#F6FAF7', padding: '2px 6px', borderRadius: 4 }}>.env</code> 並填入：
        </div>
        <pre style={{ marginTop: 12, background: '#F6FAF7', borderRadius: 12, padding: 14, fontSize: 12, overflow: 'auto' }}>
{`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`}
        </pre>
        <div style={{ fontSize: 12, color: '#6E8B7C', marginTop: 10, fontWeight: 600 }}>填好後重新啟動 <code>npx vite</code>。</div>
      </div>
    </div>
  );
}

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

  if (!supabaseReady) return <ConfigMissing />;
  if (!ready) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6E8B7C', fontWeight: 700 }}>初始化…</div>;
  if (!session) return <Auth lineDebug={lineDebug} />;
  return <App session={session} onSignOut={() => supabase.auth.signOut()} />;
}
