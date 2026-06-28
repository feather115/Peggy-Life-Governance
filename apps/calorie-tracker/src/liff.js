// 初始化 LINE LIFF + 在 LINE 裡開啟時自動登入
// 沒設定 VITE_LIFF_ID 時整段跳過，App 照常當一般網頁運作，不影響任何現有功能
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

// 只有在 LINE App 內開啟（liff.isInClient()）才會自動登入；一般瀏覽器照舊用 email/密碼登入畫面
// 回傳 { ok, reason }：ok=true 代表已經幫使用者建立好 Supabase session；reason 是診斷用的失敗原因
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
    if (!res.ok) return { ok: false, reason: `/api/line-login 失敗：${data.error || '未知錯誤'}` };

    const { error } = await supabase.auth.verifyOtp({ token_hash: data.tokenHash, type: 'magiclink' });
    if (error) return { ok: false, reason: `verifyOtp 失敗：${error.message}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: `例外：${e.message}` };
  }
}

// 是否能在這台裝置上做 LINE 連結（必須在 LINE App 裡開，且已經是 LIFF 登入狀態）
export function canLinkLine() {
  return !!import.meta.env.VITE_LIFF_ID && liff.isInClient() && liff.isLoggedIn();
}

// 把目前登入中的帳號跟這個 LINE 身份綁定，之後從 LINE 開啟會直接登入這個帳號（不會變成另一個新帳號）
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
