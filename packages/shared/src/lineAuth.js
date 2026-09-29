// ============================================================
//  LINE LIFF 整合的共用邏輯 — 三個 app（calorie-tracker / recipe-book / calendar）
//  的 src/liff.js 都只是這個 factory 的薄殼，不要在各 app 裡複製貼上改邏輯。
//
//  用法（各 app 的 src/liff.js）：
//    import { createLineAuth } from '@peggy-life/shared/lineAuth';
//    import { supabase } from './supabase.js';
//    export const { initLiff, lineAutoLogin, ... } = createLineAuth(supabase);
//
//  另外提供兩個 React hook，讓三個 app 的 Root.jsx / 設定頁 LineLinker 只負責畫面：
//    useSession()          — Root.jsx：拿 session（沒登入且在 LINE 裡會先試自動登入）
//    useLineLinked(key)    — 設定頁：LINE 連結狀態（含 localStorage 快取）與連結動作
//
//  @line/liff 用動態 import：只有「有設 VITE_LIFF_ID 且 user agent 看起來是 LINE
//  in-app browser」才會下載 liff SDK。一般瀏覽器（含桌機）完全不載入，主 bundle 變小、
//  首次載入變快。判斷邏輯跟載入後再檢查 isInClient() 等價——isInClient() 為 false 時
//  自動登入/帳號連結本來就全都不會發生，所以 UA 不含 Line 時直接跳過不會少功能。
// ============================================================

import { useEffect, useState } from 'react';

export function createLineAuth(supabase) {
  let liff = null; // 動態載入後的 liff instance；null = 沒載（沒設 LIFF_ID 或不在 LINE 裡）

  function looksLikeLineClient() {
    return /Line\//i.test(navigator.userAgent);
  }

  async function initLiff() {
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

  // 只有在 LINE App 裡開（liff.isInClient()）才會自動登入；一般瀏覽器 fallback 到 email/密碼登入頁。
  // 回傳 { ok, reason }：ok=true 表示 Supabase session 已建立；reason 是給登入頁除錯文字用的失敗原因。
  async function lineAutoLogin() {
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

  // 這台裝置能不能做 LINE 帳號連結（要在 LINE App 裡開、且 LIFF 已登入）
  function canLinkLine() {
    return !!import.meta.env.VITE_LIFF_ID && !!liff && liff.isInClient() && liff.isLoggedIn();
  }

  // 重新跳 LINE 的 profile/openid 同意畫面（例如使用者之前把同意畫面關掉，
  // 導致 liff.getIDToken() 回 null）。只在 LINE App 裡有意義；需要 LIFF SDK v2.13+（liff.permission）。
  async function retryLineAuthorization() {
    if (!liff || !liff.isInClient() || !liff.isLoggedIn()) {
      throw new Error('請在 LINE App 裡開啟這個頁面才能重新申請授權');
    }
    const status = await liff.permission.query('profile');
    if (status.state === 'granted') {
      // 已經同意過了，不用再跳同意畫面（requestAll 在全部已同意時會 reject）
      return { alreadyGranted: true };
    }
    await liff.permission.requestAll();
    return { alreadyGranted: false };
  }

  // 把目前登入中的帳號綁定到這個 LINE 身份。之後從 LINE 開啟會直接登入這個帳號（不會另開新帳號）。
  async function linkLineAccount() {
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

  // 查詢目前登入的帳號是否已綁定 LINE 身份。不管在 LINE App 還是一般瀏覽器都能查
  // （這只是讀一筆 DB 資料，不需要 LIFF auth）。
  // 「不確定」（還沒 session／網路失敗／後端錯誤）時回 null，讓呼叫端不要把暫時性失敗
  // 誤判成「確定沒連結」而蓋掉快取的 true。
  async function checkLineLinked() {
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

  // Root.jsx 用：啟動時拿 Supabase session；沒登入且在 LINE App 裡開時先試 LINE 自動登入，
  // 之後持續跟著 onAuthStateChange 更新。回傳 { session, ready, lineDebug }，
  // lineDebug 是自動登入失敗的原因（登入頁最下面的除錯灰字，方便在手機上定位問題）。
  function useSession() {
    const [session, setSession] = useState(null);
    const [ready, setReady] = useState(false);
    const [lineDebug, setLineDebug] = useState('');

    useEffect(() => {
      if (!supabase) { setReady(true); return; } // .env 沒設定，Root 會顯示 ConfigMissing
      let cancel = false;
      supabase.auth.getSession().then(async ({ data }) => {
        if (data.session) { if (!cancel) { setSession(data.session); setReady(true); } return; }
        const result = await lineAutoLogin();
        if (!result.ok && !cancel) setLineDebug(result.reason || '');
        const { data: data2 } = await supabase.auth.getSession();
        if (!cancel) { setSession(data2.session); setReady(true); }
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
      return () => { cancel = true; sub.subscription.unsubscribe(); };
    }, []);

    return { session, ready, lineDebug };
  }

  // 設定頁「連結 LINE 帳號」的狀態與動作（三個 app 的 LineLinker 共用，各 app 只負責畫面）。
  // linked：null = 還不確定（還沒查完、也沒有本地快取）；true/false = 確定的狀態。
  // 查到 true 就快取到 localStorage（cacheKey 每個 app 不同），重開 app 先用快取顯示「已連結」，
  // 不會因為查詢還沒回來、或暫時失敗（例如網路不穩）就閃一下「連結」按鈕。
  // msg：'' | 'success' | 錯誤訊息。
  function useLineLinked(cacheKey) {
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');
    const [linked, setLinked] = useState(() => {
      try {
        return localStorage.getItem(cacheKey) === '1' ? true : null;
      } catch {
        return null;
      }
    });

    useEffect(() => {
      let cancel = false;
      checkLineLinked().then((result) => {
        if (cancel || result === null) return; // 查不到明確結果（沒 session／網路失敗／後端錯誤），保留原本的狀態，不要誤判成「沒連結」
        setLinked(result);
        try {
          if (result) localStorage.setItem(cacheKey, '1');
          else localStorage.removeItem(cacheKey);
        } catch {}
      });
      return () => { cancel = true; };
    }, [cacheKey]);

    const link = async () => {
      setBusy(true); setMsg('');
      try {
        await linkLineAccount();
        setLinked(true);
        try { localStorage.setItem(cacheKey, '1'); } catch {}
        setMsg('success');
      } catch (e) {
        setMsg(e.message || '連結失敗');
      } finally {
        setBusy(false);
      }
    };

    return { linked, busy, msg, link };
  }

  return {
    initLiff, lineAutoLogin, canLinkLine, retryLineAuthorization, linkLineAccount, checkLineLinked,
    useSession, useLineLinked,
  };
}
