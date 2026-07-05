// Links the currently logged-in account with this LINE user. Afterwards, opening the app from LINE will automatically log in to this account.
import { verifyLineIdToken } from './_lineVerify.js';
import { getSupabaseAdmin, getSupabaseAdminForLine } from './_supabaseAdmin.js';

export async function linkLineAccount(idToken, channelId, accessToken) {
  if (!accessToken) throw new Error('缺少登入憑證，請先用 email 登入再連結');
  const admin = getSupabaseAdmin();

  const { data: userData, error: userErr } = await admin.auth.getUser(accessToken);
  if (userErr || !userData?.user) throw new Error('登入憑證無效，請重新登入後再試');

  const payload = await verifyLineIdToken(idToken, channelId);

  const adminForLine = getSupabaseAdminForLine();
  const { error } = await adminForLine.from('line_links').upsert({ line_sub: payload.sub, user_id: userData.user.id });
  if (error) {
    console.error('[linkLineAccount] upsert line_links failed:', JSON.stringify(error));
    throw error;
  }

  return { ok: true };
}
