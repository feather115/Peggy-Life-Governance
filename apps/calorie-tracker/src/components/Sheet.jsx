// Shared bottom sheet wrapper (used by food library, advanced settings, and other modal sheets)
// Fixed to window bottom, centered, max-width 520, with semi-transparent backdrop and top handle
// 無障礙：role=dialog + aria-modal，開啟時焦點移進面板、Esc 關閉、關閉後焦點還給原本的觸發元素
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const openSheets = [];

export default function Sheet({ onBackdrop, height, zIndex = 10, label = '對話視窗', children }) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onBackdrop);
  onCloseRef.current = onBackdrop;

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
        bottom: 0, height, background: 'var(--surface)', borderRadius: '30px 30px 0 0', display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-sheet)',
      }}>
        <div style={{ padding: '12px 0 2px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 40, height: 5, borderRadius: 5, background: 'var(--track)' }} />
        </div>
        {children}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
