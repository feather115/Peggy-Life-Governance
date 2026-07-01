// Checks whether the currently logged-in account already has a LINE identity linked.
import { getSupabaseAdmin, getSupabaseAdminForLine } from './_supabaseAdmin.js';

export async function checkLineLinkStatus(accessToken) {
  if (!accessToken) throw new Error('缺少登入憑證');
  const admin = getSupabaseAdmin();

  const { data: userData, error: userErr } = await admin.auth.getUser(accessToken);
  if (userErr || !userData?.user) throw new Error('登入憑證無效，請重新登入後再試');

  const adminForLine = getSupabaseAdminForLine();
  const { data, error } = await adminForLine
    .from('line_links')
    .select('line_sub')
    .eq('user_id', userData.user.id)
    .maybeSingle();
  if (error) throw error;

  return { linked: !!data };
}
