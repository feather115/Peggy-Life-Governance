// Initialize LINE LIFF + auto-login when opened inside LINE
// Skip if VITE_LIFF_ID is not configured; the App will function as a standard web page without affecting any existing features.
import liff from '@line/liff';
import { supabase } from './supabase.js';

export async function initLiff() {
  const liffId = import.meta.env.VITE_LIFF_ID;
  if (!liffId) return;
  try {
    await liff.init({ liffId });
  } catch (e) {
    console.warn('LIFF init failed（在一般瀏覽器測試時這是正常的）:', e.message);
  }
}

// Auto-login only occurs when opened inside the LINE App (liff.isInClient()); standard browsers will fall back to the email/password login screen.
// Returns { ok, reason }: ok=true means the Supabase session has been established for the user; reason contains the diagnostic failure reason.
export async function lineAutoLogin() {
  if (!import.meta.env.VITE_LIFF_ID) return { ok: false, reason: '沒設定 VITE_LIFF_ID' };
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
  return !!import.meta.env.VITE_LIFF_ID && liff.isInClient() && liff.isLoggedIn();
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
  if (!res.ok) {
    const extra = [data.code, data.details, data.hint].filter(Boolean).join(' / ');
    throw new Error(extra ? `${data.error || '連結失敗'}（${extra}）` : (data.error || '連結失敗'));
  }
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
