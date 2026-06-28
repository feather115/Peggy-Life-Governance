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
  const [lineDebug, setLineDebug] = useState('');
  const [guest, setGuest] = useState(false);

  useEffect(() => {
    if (!supabaseReady) { setReady(true); return; }
    let cancel = false;
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) { if (!cancel) { setSession(data.session); setReady(true); } return; }
      const result = await lineAutoLogin();
      if (!result.ok && !cancel) setLineDebug(result.reason || '');
      const { data: data2 } = await supabase.auth.getSession();
      if (!cancel) { setSession(data2.session); setReady(true); }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) setGuest(false);
    });
    return () => { cancel = true; sub.subscription.unsubscribe(); };
  }, []);

  if (!supabaseReady) return <ConfigMissing appName="TY Recipe Book App" />;
  if (!ready) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6E8B7C', fontWeight: 700 }}>初始化…</div>;
  if (!session && !guest) return <Auth lineDebug={lineDebug} onGuest={() => setGuest(true)} />;
  return (
    <App
      session={session}
      onSignOut={() => { setGuest(false); return supabase.auth.signOut(); }}
      onExitGuest={() => setGuest(false)}
    />
  );
}
