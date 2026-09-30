// Root component: decides whether to show the "missing configuration prompt / login page / main app".
// session 取得、LINE 自動登入、auth 狀態監聽都在 @peggy-life/shared/lineAuth 的 useSession（三個 app 共用），
// 這裡只決定要顯示哪個畫面。
import React, { useState } from 'react';
import { supabase, supabaseReady } from './supabase.js';
import { useSession } from './liff.js';
import Auth from './components/Auth.jsx';
import App from './App.jsx';
import ConfigMissing from '@peggy-life/shared/ConfigMissing.jsx';

export default function Root() {
  const { session, ready, lineDebug } = useSession();
  const [guest, setGuest] = useState(false);

  // 登入後自動離開訪客模式（原本寫在 onAuthStateChange 裡；render 中依條件調整 state 是 React 允許的寫法）
  if (session && guest) setGuest(false);

  if (!supabaseReady) return <ConfigMissing appName="TY Recipe Book App" />;
  if (!ready) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontWeight: 700 }}>初始化…</div>;
  if (!session && !guest) return <Auth lineDebug={lineDebug} onGuest={() => setGuest(true)} />;
  return (
    <App
      session={session}
      onSignOut={() => { setGuest(false); return supabase.auth.signOut(); }}
      onExitGuest={() => setGuest(false)}
    />
  );
}
