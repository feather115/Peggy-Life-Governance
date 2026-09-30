// Shared bottom sheet wrapper (used by food library, advanced settings, and other modal sheets)
// Fixed to window bottom, centered, max-width 520, with semi-transparent backdrop and top handle
// 無障礙：role=dialog + aria-modal，開啟時焦點移進面板、Esc 關閉、關閉後焦點還給原本的觸發元素
// 手機返回鍵（Android / LINE）也是關閉面板，不會直接離開 app
// 標題列用下面的 <SheetHeader>：左邊標題、右邊關閉 ×（所有面板長一樣，關閉一律是右上 ×）
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useBackClose } from '@peggy-life/shared/useBackClose';
import Icon from '@peggy-life/shared/Icon.jsx';
import { UI } from '@peggy-life/shared/ui';

const openSheets = [];

const HS = {
  bar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 12px 8px 20px', flex: 'none' },
  title: { margin: 0, fontSize: 18, lineHeight: 1.3, fontWeight: 600, color: 'var(--text)' },
  subtitle: { fontSize: 13, color: 'var(--text-muted)', marginTop: 2 },
  actions: { display: 'flex', alignItems: 'center', gap: 8, flex: 'none' },
};

// children：放在關閉鈕左邊的動作（例如表單的「儲存」）
export function SheetHeader({ title, subtitle, onClose, closeLabel = '關閉', children }) {
  return (
    <div style={HS.bar}>
      <div style={{ minWidth: 0 }}>
        <h2 style={HS.title}>{title}</h2>
        {subtitle && <div style={HS.subtitle}>{subtitle}</div>}
      </div>
      <div style={HS.actions}>
        {children}
        <button type="button" aria-label={closeLabel} onClick={onClose} style={UI.iconBtnPlain}><Icon name="x" size={20} /></button>
      </div>
    </div>
  );
}

export default function Sheet({ onBackdrop, height, zIndex = 10, label = '對話視窗', children }) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onBackdrop);
  onCloseRef.current = onBackdrop;
  useBackClose(true, onBackdrop);

  useEffect(() => {
    const opener = document.activeElement;
    const me = {};
    openSheets.push(me);
    panelRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape' && openSheets[openSheets.length - 1] === me) onCloseRef.current?.(); };
    document.addEventListener('keydown', onKey);
    return () => {
      openSheets.splice(openSheets.indexOf(me), 1);
      document.removeEventListener('keydown', onKey);
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus();
    };
  }, []);

  const content = (
    <div style={{ position: 'fixed', inset: 0, zIndex, display: 'flex', justifyContent: 'center' }}>
      <div onClick={onBackdrop} style={{ position: 'absolute', inset: 0, background: 'var(--scrim)' }} />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} style={{
        outline: 'none', position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 520,
        bottom: 0, height, background: 'var(--surface)', borderRadius: '20px 20px 0 0', display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-sheet)',
      }}>
        <div style={{ padding: '8px 0 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--line-strong)' }} />
        </div>
        {children}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
