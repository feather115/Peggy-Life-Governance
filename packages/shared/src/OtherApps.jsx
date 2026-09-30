// 設定頁的「其他 App」入口：三個 app 共用同一個帳號，從這裡直接跳到另外兩個，不用回 LINE 找連結。
// 連結用 LIFF URL（在 LINE 裡開會留在 LINE、在一般瀏覽器會轉到網站）。LIFF ID 來自各 app 的環境變數
// VITE_LIFF_ID_CALORIE / VITE_LIFF_ID_RECIPE / VITE_LIFF_ID_CALENDAR，沒設的就不顯示；三個都沒設整塊不顯示。
import React from 'react';
import Icon from './Icon.jsx';

const APPS = [
  { key: 'calorie', name: '飲食卡路里', desc: '記錄每天吃了什麼', liffId: import.meta.env.VITE_LIFF_ID_CALORIE },
  { key: 'recipe', name: '食譜本', desc: '收藏與分享食譜', liffId: import.meta.env.VITE_LIFF_ID_RECIPE },
  { key: 'calendar', name: '行事曆', desc: '行程、日記與週期任務', liffId: import.meta.env.VITE_LIFF_ID_CALENDAR },
];

const S = {
  card: { background: 'var(--surface)', borderRadius: 20, padding: '16px 18px', boxShadow: 'var(--shadow-card)' },
  title: { fontSize: 14, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 6 },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 0', textDecoration: 'none', color: 'var(--text)', borderTop: '1px solid var(--line)' },
  name: { fontSize: 15, fontWeight: 800 },
  desc: { fontSize: 13, color: 'var(--text-muted)', marginTop: 2 },
};

export default function OtherApps({ current }) {
  const links = APPS.filter((a) => a.key !== current && a.liffId);
  if (links.length === 0) return null;
  return (
    <nav aria-label="其他 App" style={S.card}>
      <div style={S.title}>其他 App</div>
      {links.map((a, i) => (
        <a key={a.key} href={`https://liff.line.me/${a.liffId}`} style={{ ...S.row, ...(i === 0 ? { borderTop: 'none', paddingTop: 4 } : {}) }}>
          <span>
            <span style={S.name}>{a.name}</span>
            <span style={{ ...S.desc, display: 'block' }}>{a.desc}</span>
          </span>
          <Icon name="chevron-right" size={18} style={{ color: 'var(--text-faint)' }} />
        </a>
      ))}
    </nav>
  );
}
