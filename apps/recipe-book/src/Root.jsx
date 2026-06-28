// Root component: checks .env configuration first, then passes the loaded recipes data to the App.
import React from 'react';
import { supabaseReady } from './supabase.js';
import ConfigMissing from '@peggy-life/shared/ConfigMissing.jsx';
import App from './App.jsx';
import { useRecipes } from './useRecipes.js';

function Centered({ children, color = '#57606a' }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, color, fontWeight: 700 }}>
      {children}
    </div>
  );
}

export default function Root() {
  if (!supabaseReady) return <ConfigMissing appName="食譜紀錄網站" />;

  const recipes = useRecipes();

  if (!recipes.loaded) return <Centered>載入中…</Centered>;
  if (recipes.loadError) return <Centered color="#B91C1C">載入失敗：{recipes.loadError}</Centered>;

  return <App recipes={recipes} />;
}
