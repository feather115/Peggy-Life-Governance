import React from 'react';

export default function ConfigMissing({ appName = 'App' }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--surface, #fff)', borderRadius: 20, padding: 28, maxWidth: 480, boxShadow: 'var(--shadow-card)' }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)' }}>{appName} 需要 Supabase 設定</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.7, fontWeight: 600 }}>
          請在專案根目錄建立 <code style={{ background: 'var(--surface-alt)', padding: '2px 6px', borderRadius: 4 }}>.env</code> 並填入：
        </div>
        <pre style={{ marginTop: 12, background: 'var(--surface-alt)', borderRadius: 14, padding: 14, fontSize: 12, overflow: 'auto' }}>
{`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`}
        </pre>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, fontWeight: 600 }}>填好後重新啟動 <code>npx vite</code>。</div>
      </div>
    </div>
  );
}
