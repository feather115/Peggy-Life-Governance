// Shared bottom sheet wrapper (used by food library, JSON import, and advanced settings)
// Fixed to window bottom, centered, max-width 520, with semi-transparent backdrop and top handle
import React from 'react';
import { createPortal } from 'react-dom';

export default function Sheet({ onBackdrop, height, zIndex = 10, children }) {
  const content = (
    <div style={{ position: 'fixed', inset: 0, zIndex, display: 'flex', justifyContent: 'center' }}>
      <div onClick={onBackdrop} style={{ position: 'absolute', inset: 0, background: 'rgba(35,64,52,.42)' }} />
      <div style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 520,
        bottom: 0, height, background: '#fff', borderRadius: '30px 30px 0 0', display: 'flex', flexDirection: 'column',
        boxShadow: '0 -12px 40px rgba(0,0,0,.22)',
      }}>
        <div style={{ padding: '12px 0 2px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 40, height: 5, borderRadius: 5, background: '#DCEDE3' }} />
        </div>
        {children}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
