// 三個 app 共用的回饋元件，取代瀏覽器原生 alert/confirm（原生框在 LINE 內建瀏覽器會帶網址當標題、
// 而且會卡住整個畫面）：
//   toast(message, { tone: 'error', action: { label: '復原', onClick } })  — 畫面底部短暫提示，可附一顆按鈕
//   await confirmDialog({ title, message, confirmText, danger })  — app 內確認框，回傳 true/false
// 每個 app 的 main.jsx 在 <Root /> 旁邊放一個 <FeedbackHost />，其他地方直接呼叫上面兩個函式。
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useBackClose } from './useBackClose.js';

let emit = null;
let seq = 0;

export function toast(message, { tone = 'default', action, duration } = {}) {
  emit?.({ kind: 'toast', item: { id: ++seq, message, tone, action, duration: duration ?? (action ? 5000 : 2800) } });
}

export function confirmDialog({ title, message, confirmText = '確定', cancelText = '取消', danger = false }) {
  return new Promise((resolve) => {
    if (!emit) { resolve(window.confirm([title, message].filter(Boolean).join('\n'))); return; }
    emit({ kind: 'confirm', item: { title, message, confirmText, cancelText, danger, resolve } });
  });
}

const S = {
  toastWrap: { position: 'fixed', left: 16, right: 16, bottom: 'calc(96px + env(safe-area-inset-bottom))', zIndex: 60, display: 'flex', justifyContent: 'center', pointerEvents: 'none' },
  toast: (tone) => ({ pointerEvents: 'auto', maxWidth: 480, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 10px 10px 16px', borderRadius: 14, boxShadow: 'var(--shadow-sheet)', background: tone === 'error' ? 'var(--danger-fill, var(--danger))' : '#1F2733', color: '#fff', fontSize: 14, fontWeight: 700, lineHeight: 1.4 }),
  toastAction: { border: 'none', background: 'rgba(255,255,255,.18)', color: '#fff', fontSize: 14, fontWeight: 800, padding: '7px 12px', borderRadius: 10, whiteSpace: 'nowrap' },
  scrim: { position: 'fixed', inset: 0, zIndex: 70, background: 'var(--scrim)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 340, background: 'var(--surface)', borderRadius: 20, padding: '22px 20px 16px', boxShadow: 'var(--shadow-sheet)', outline: 'none' },
  title: { fontSize: 16, fontWeight: 800, color: 'var(--text)', lineHeight: 1.4 },
  message: { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 6, whiteSpace: 'pre-wrap' },
  actions: { display: 'flex', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, border: 'none', background: 'var(--sunken)', color: 'var(--text)', fontSize: 15, fontWeight: 700, padding: 12, borderRadius: 14 },
  confirmBtn: (danger) => ({ flex: 1, border: 'none', background: danger ? 'var(--danger-fill, var(--danger))' : 'var(--primary-fill, var(--primary))', color: '#fff', fontSize: 15, fontWeight: 800, padding: 12, borderRadius: 14 }),
};

function ConfirmDialog({ title, message, confirmText, cancelText, danger, onClose }) {
  const cancelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });
  useBackClose(true, () => onClose(false));

  // 焦點預設在「取消」（誤按 Enter 不會執行危險動作）；關閉後還給原本的按鈕。
  // Esc 用 capture 攔下來，底下開著的 bottom sheet 才不會跟著一起關。
  useEffect(() => {
    const opener = document.activeElement;
    cancelRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onCloseRef.current(false); } };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus();
    };
  }, []);

  return (
    <div style={S.scrim} onClick={() => onClose(false)}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby={message ? 'confirm-message' : undefined}
        style={S.dialog} onClick={(e) => e.stopPropagation()}>
        <div id="confirm-title" style={S.title}>{title}</div>
        {message && <div id="confirm-message" style={S.message}>{message}</div>}
        <div style={S.actions}>
          <button ref={cancelRef} type="button" style={S.cancelBtn} onClick={() => onClose(false)}>{cancelText}</button>
          <button type="button" style={S.confirmBtn(danger)} onClick={() => onClose(true)}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

export function FeedbackHost() {
  const [toastItem, setToastItem] = useState(null);
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    emit = ({ kind, item }) => (kind === 'toast' ? setToastItem(item) : setDialog(item));
    return () => { emit = null; };
  }, []);

  useEffect(() => {
    if (!toastItem) return undefined;
    const id = setTimeout(() => setToastItem(null), toastItem.duration);
    return () => clearTimeout(id);
  }, [toastItem]);

  const closeDialog = (ok) => { dialog?.resolve(ok); setDialog(null); };

  return createPortal(
    <>
      <div aria-live="polite" style={S.toastWrap}>
        {toastItem && (
          <div key={toastItem.id} role={toastItem.tone === 'error' ? 'alert' : 'status'} style={S.toast(toastItem.tone)}>
            <span>{toastItem.message}</span>
            {toastItem.action && (
              <button type="button" style={S.toastAction} onClick={() => { setToastItem(null); toastItem.action.onClick(); }}>
                {toastItem.action.label}
              </button>
            )}
          </div>
        )}
      </div>
      {dialog && <ConfirmDialog {...dialog} onClose={closeDialog} />}
    </>,
    document.body,
  );
}
