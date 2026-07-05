// LINE LIFF 整合（初始化 / 自動登入 / 帳號連結 / 連結狀態查詢）。
// 邏輯只有一份，在 @peggy-life/shared/lineAuth（三個 app 共用）——要改行為去那裡改，
// 這個檔案只負責把本 app 的 supabase client 綁進去。
import { createLineAuth } from '@peggy-life/shared/lineAuth';
import { supabase } from './supabase.js';

export const {
  initLiff,
  lineAutoLogin,
  canLinkLine,
  retryLineAuthorization,
  linkLineAccount,
  checkLineLinked,
} = createLineAuth(supabase);
