// Maps a verified LINE user to a Supabase account and returns credentials that can be directly exchanged for a session on the frontend.
import { verifyLineIdToken } from './_lineVerify.js';
import { getSupabaseAdmin, getSupabaseAdminForLine } from './_supabaseAdmin.js';

// Formulates a stable email address from the LINE sub that will not conflict with real email addresses.
function emailForLineSub(sub) {
  return `line-${sub}@line.invalid`;
}

export async function loginWithLine(idToken, channelId) {
  const payload = await verifyLineIdToken(idToken, channelId);
  const admin = getSupabaseAdmin();
  const adminForLine = getSupabaseAdminForLine();

  // Check if this LINE user is already linked to an existing account (the mapping stored in the "Link LINE Account" settings tab)
  const { data: linkRow } = await adminForLine.from('line_links').select('user_id').eq('line_sub', payload.sub).maybeSingle();
  let email;
  if (linkRow) {
    const { data: userData, error: getErr } = await admin.auth.admin.getUserById(linkRow.user_id);
    if (getErr || !userData?.user?.email) throw getErr || new Error('找不到連結的帳號');
    email = userData.user.email;
  } else {
    // Not linked: create a dedicated account using the LINE sub (created on first encounter, ignore "already registered" error if it already exists and proceed)
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

  // Generates a one-time login link (which also returns the user object corresponding to this email); the frontend will exchange the token_hash for an actual session
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (linkErr) throw linkErr;

  // If the user hasn't set their own nickname yet, populate it with the LINE display name (only if blank; do not overwrite a user-defined nickname)
  const userId = linkData.user?.id;
  if (payload.name && userId) {
    const { data: settings } = await admin.from('user_settings').select('display_name').eq('user_id', userId).maybeSingle();
    if (settings && !settings.display_name) {
      await admin.from('user_settings').update({ display_name: payload.name }).eq('user_id', userId);
    }
  }

  return { email, tokenHash: linkData.properties.hashed_token };
}
