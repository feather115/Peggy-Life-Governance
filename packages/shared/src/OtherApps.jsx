// 設定頁的「其他 App」入口：三個 app 共用同一個帳號，從這裡直接跳到另外兩個，不用回 LINE 找連結。
// 連結用 LIFF URL（在 LINE 裡開會留在 LINE、在一般瀏覽器會轉到網站）。LIFF ID 來自各 app 的環境變數
// VITE_LIFF_ID_CALORIE / VITE_LIFF_ID_RECIPE / VITE_LIFF_ID_CALENDAR，沒設的就不顯示；三個都沒設整塊不顯示。
// 每個 app 的小圖示用「那個 app 的主色」（寫在這裡，因為目前這個 app 的 theme.css 只有自己的主色）。
// 外距由設定頁用 style 傳進來，整塊不顯示時就不會在頁面上留下一段空白。
import React from 'react';
import Icon from './Icon.jsx';
import { UI } from './ui.js';

const APPS = [
  { key: 'calorie', name: '飲食卡路里', desc: '記錄每天吃了什麼', icon: 'flame', color: '#29774F', liffId: import.meta.env.VITE_LIFF_ID_CALORIE },
  { key: 'recipe', name: '食譜本', desc: '收藏與分享食譜', icon: 'book', color: '#9F4F2F', liffId: import.meta.env.VITE_LIFF_ID_RECIPE },
  { key: 'calendar', name: '行事曆', desc: '行程、日記與週期任務', icon: 'calendar', color: '#3F6AA1', liffId: import.meta.env.VITE_LIFF_ID_CALENDAR },
];

const S = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 8 },
  row: { ...UI.row, textDecoration: 'none' },
  appIcon: (color) => ({ width: 30, height: 30, flex: 'none', borderRadius: 10, background: color, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }),
};

export default function OtherApps({ current, style }) {
  const links = APPS.filter((a) => a.key !== current && a.liffId);
  if (links.length === 0) return null;
  return (
    <nav aria-label="其他 App" style={{ ...S.wrap, ...style }}>
      <div style={UI.groupLabel}>其他 App</div>
      <div style={UI.listCard}>
        {links.map((a, i) => (
          <React.Fragment key={a.key}>
            {i > 0 && <div style={{ ...UI.divider, marginLeft: 58 }} />}
            <a href={`https://liff.line.me/${a.liffId}`} style={S.row}>
              <span style={S.appIcon(a.color)}><Icon name={a.icon} size={16} strokeWidth={2} /></span>
              <span style={UI.rowText}>
                <span style={{ ...UI.rowTitle, fontWeight: 400 }}>{a.name}</span>
                <span style={UI.rowMeta}>{a.desc}</span>
              </span>
              <Icon name="chevron-right" size={18} style={{ color: 'var(--text-faint)' }} />
            </a>
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
}
