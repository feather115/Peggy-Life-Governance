// Initialize LINE LIFF + auto-login when opened inside LINE
// Skip if VITE_LIFF_ID is not configured; the App will function as a standard web page without affecting any existing features.
//
// @line/liff 改用動態 import：只有「有設 VITE_LIFF_ID 且 user agent 看起來是 LINE
// in-app browser」才會下載 liff SDK。一般瀏覽器（含桌機）完全不載入，主 bundle 變小、
// 首次載入變快。判斷邏輯跟舊行為等價——舊版就算載入了 liff，只要 isInClient() 是
// false，自動登入/帳號連結也全都不會發生，所以 UA 不含 Line 時直接跳過不會少功能。
import { supabase } from './supabase.js';

let liff = null; // 動態載入後的 liff instance；null = 沒載（沒設 LIFF_ID 或不在 LINE 裡）

function looksLikeLineClient() {
  return /Line\//i.test(navigator.userAgent);
}

export async function initLiff() {
  const liffId = import.meta.env.VITE_LIFF_ID;
  if (!liffId || !looksLikeLineClient()) return;
  try {
    const mod = await import('@line/liff');
    liff = mod.default;
    await liff.init({ liffId });
  } catch (e) {
    console.warn('LIFF init failed (normal when testing in a regular browser):', e.message);
  }
}

// Auto-login only occurs when opened inside the LINE App (liff.isInClient()); standard browsers will fall back to the email/password login screen.
// Returns { ok, reason }: ok=true means the Supabase session has been established for the user; reason contains the diagnostic failure reason.
export async function lineAutoLogin() {
  if (!import.meta.env.VITE_LIFF_ID) return { ok: false, reason: '沒設定 VITE_LIFF_ID' };
  if (!liff) return { ok: false, reason: '不是在 LINE App 裡開的（liff 未載入）' };
  if (!liff.isInClient()) return { ok: false, reason: '不是在 LINE App 裡開的（isInClient=false）' };
  if (!liff.isLoggedIn()) return { ok: false, reason: 'liff.isLoggedIn() = false' };

  try {
    const idToken = liff.getIDToken();
    if (!idToken) return { ok: false, reason: 'liff.getIDToken() 是 null，可能 LIFF app 的 openid scope 沒生效' };

    const res = await fetch('/api/line-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const data = await res.json();
    if (!res.ok) {
      const extra = [data.code, data.details, data.hint].filter(Boolean).join(' / ');
      return { ok: false, reason: `/api/line-login 失敗：${data.error || '未知錯誤'}${extra ? `（${extra}）` : ''}` };
    }

    const { error } = await supabase.auth.verifyOtp({ token_hash: data.tokenHash, type: 'magiclink' });
    if (error) return { ok: false, reason: `verifyOtp 失敗：${error.message}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: `例外：${e.message}` };
  }
}

// Whether LINE linking can be performed on this device (must be opened in LINE App and logged in via LIFF)
export function canLinkLine() {
  return !!import.meta.env.VITE_LIFF_ID && !!liff && liff.isInClient() && liff.isLoggedIn();
}

// Binds the currently logged-in account to this LINE identity. Afterwards, opening from LINE will directly log in to this account (without creating a new account).
export async function linkLineAccount() {
  if (!canLinkLine()) throw new Error('請在 LINE App 裡開啟這個頁面才能連結');

  const idToken = liff.getIDToken();
  if (!idToken) throw new Error('拿不到 LINE 身份令牌（openid scope 可能沒生效）');

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error('請先登入帳號再連結');

  const res = await fetch('/api/line-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, accessToken }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '連結失敗');
}

// Checks whether the currently logged-in account already has a LINE identity linked.
// Works regardless of whether opened inside the LINE App or a regular browser
// (this is just reading a DB row, not doing LIFF auth).
// Returns null on "unknown" (no session yet, network error, backend error) so callers
// don't mistake a transient failure for "definitely not linked" and clobber a cached true.
export async function checkLineLinked() {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) return null;
  try {
    const res = await fetch('/api/line-link-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken }),
    });
    const data = await res.json();
    if (!res.ok) return null;
    return !!data.linked;
  } catch {
    return null;
  }
}
