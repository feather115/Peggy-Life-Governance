// Root component: decides whether to show the "missing configuration prompt / login page / main app".
// Listens to Supabase auth status change, and passes the session to the App after login.
import React, { useState, useEffect } from 'react';
import { supabase, supabaseReady } from './supabase.js';
import { lineAutoLogin } from './liff.js';
import Auth from './components/Auth.jsx';
import App from './App.jsx';
import ConfigMissing from '@peggy-life/shared/ConfigMissing.jsx';

export default function Root() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [lineDebug, setLineDebug] = useState(''); // Temporary diagnostic text for debugging LINE auto-login failures

  useEffect(() => {
    if (!supabaseReady) { setReady(true); return; }
    let cancel = false;
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) { if (!cancel) { setSession(data.session); setReady(true); } return; }
      // If not logged in and opened inside the LINE App, try auto-logging in with LINE identity first.
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
