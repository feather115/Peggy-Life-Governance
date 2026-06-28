// 把驗證過的 LINE 使用者對應成 Supabase 帳號，回傳一組可以在前端直接交換 session 的憑證
import { verifyLineIdToken } from './_lineVerify.js';
import { getSupabaseAdmin } from './_supabaseAdmin.js';

// 用 LINE 的 sub 組一個固定、不會跟真實 email 衝突的帳號信箱
function emailForLineSub(sub) {
  return `line-${sub}@line.invalid`;
}

export async function loginWithLine(idToken, channelId) {
  const payload = await verifyLineIdToken(idToken, channelId);
  const admin = getSupabaseAdmin();

  // 先看這個 LINE 使用者有沒有連結過既有帳號（設定頁「連結 LINE 帳號」存的對照）
  const { data: linkRow } = await admin.from('line_links').select('user_id').eq('line_sub', payload.sub).maybeSingle();
  let email;
  if (linkRow) {
    const { data: userData, error: getErr } = await admin.auth.admin.getUserById(linkRow.user_id);
    if (getErr || !userData?.user?.email) throw getErr || new Error('找不到連結的帳號');
    email = userData.user.email;
  } else {
    // 沒連結過：用 LINE sub 組一個專屬帳號（第一次見到就建立，已存在則忽略「已註冊」錯誤繼續往下走）
    email = emailForLineSub(payload.sub);
    const { error: createErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { line_sub: payload.sub, display_name: payload.name || '' },
    });
    if (createErr && !/already.*registered/i.test(createErr.message || '')) {
      throw createErr;
    }
  }

  // 產生一次性登入連結（同時會回傳這個 email 對應的 user 物件），前端用 token_hash 換真正的 session
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (linkErr) throw linkErr;

  // 如果使用者還沒自己設過暱稱，順手帶入 LINE 的顯示名稱（只在空白時做，不覆蓋使用者自訂的暱稱）
  const userId = linkData.user?.id;
  if (payload.name && userId) {
    const { data: settings } = await admin.from('user_settings').select('display_name').eq('user_id', userId).maybeSingle();
    if (settings && !settings.display_name) {
      await admin.from('user_settings').update({ display_name: payload.name }).eq('user_id', userId);
    }
  }

  return { email, tokenHash: linkData.properties.hashed_token };
}
