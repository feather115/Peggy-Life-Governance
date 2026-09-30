// 載入中的骨架畫面：用灰色色塊先排出「標題＋卡片」的版面，比一行「載入中…」感覺快、資料進來時畫面也不會整個跳。
// 閃爍動畫在 base.css（.skeleton），使用者開了「減少動態效果」時不會動。
import React from 'react';
import { UI } from './ui.js';

const S = {
  wrap: { width: '100%', maxWidth: 520, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 12 },
  bar: (width, height) => ({ width, height, borderRadius: 4 }),
  card: (height) => ({ height, borderRadius: 14 }),
};

export default function LoadingSkeleton({ label = '載入中' }) {
  return (
    <div role="status" aria-label={label} style={S.wrap}>
      <div className="skeleton" style={S.bar('40%', 26)} />
      <div className="skeleton" style={{ ...S.bar('55%', 14), marginBottom: 8 }} />
      <div className="skeleton" style={S.card(180)} />
      <div className="skeleton" style={S.card(84)} />
      <div className="skeleton" style={S.card(84)} />
    </div>
  );
}

// 載入失敗：說明原因，並給一顆「重新載入」（原本只有一行紅字，使用者不知道能做什麼）
export function LoadError({ message }) {
  return (
    <div role="alert" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>資料載入失敗</div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 320 }}>{message || '請檢查網路連線後再試一次'}</div>
      <button type="button" onClick={() => window.location.reload()} style={{ ...UI.btnPrimary, marginTop: 8 }}>重新載入</button>
    </div>
  );
}
