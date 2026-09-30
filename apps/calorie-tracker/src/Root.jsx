// Root component: decides whether to show the "missing configuration prompt / login page / main app".
// session 取得、LINE 自動登入、auth 狀態監聽都在 @peggy-life/shared/lineAuth 的 useSession（三個 app 共用），
// 這裡只決定要顯示哪個畫面。
import React from 'react';
import { supabase, supabaseReady } from './supabase.js';
import { useSession } from './liff.js';
import Auth from './components/Auth.jsx';
import App from './App.jsx';
import ConfigMissing from '@peggy-life/shared/ConfigMissing.jsx';
import LoadingSkeleton from '@peggy-life/shared/LoadingSkeleton.jsx';

export default function Root() {
  const { session, ready, lineDebug } = useSession();

  if (!supabaseReady) return <ConfigMissing appName="飲食卡路里 App" />;
  if (!ready) return <LoadingSkeleton label="初始化" />;
  if (!session) return <Auth lineDebug={lineDebug} />;
  return <App session={session} onSignOut={() => supabase.auth.signOut()} />;
}
