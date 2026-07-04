// 設定頁：目前只有「管理分類與標籤」一個入口，之後有新設定選項可以加在這個清單裡。
import React from 'react';
import { THEME } from '../theme.js';

const S = {
  header: { display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: THEME.surface, borderBottom: `1px solid ${THEME.border}` },
  backBtn: { border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: THEME.textMuted, padding: '2px 6px', outline: 'none' },
  title: { fontSize: 17, fontWeight: 700, color: THEME.textDark },
  body: { padding: 20, display: 'flex', flexDirection: 'column', gap: 10 },
  row: { cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: THEME.surface, borderRadius: THEME.radiusSm, padding: '16px 18px', boxShadow: THEME.shadow },
  rowLabel: { fontSize: 15, fontWeight: 600, color: THEME.textDark },
  rowArrow: { fontSize: 15, color: THEME.textFaint },
};

export default function Settings({ onClose, onManageTags }) {
  return (
    <div>
      <div style={S.header}>
        <button type="button" onClick={onClose} style={S.backBtn} aria-label="返回">←</button>
        <div style={S.title}>設定</div>
      </div>

      <div style={S.body}>
        <div style={S.row} onClick={onManageTags}>
          <div style={S.rowLabel}>管理分類與標籤</div>
          <div style={S.rowArrow}>›</div>
        </div>
      </div>
    </div>
  );
}
