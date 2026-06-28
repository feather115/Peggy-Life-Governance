// Verifies if the LINE ID Token sent by the LIFF frontend is genuine and untampered.
// LINE_CHANNEL_ID is the Channel ID of the "LINE Login channel" (a public number, not a secret), which can be found under the Basic settings page in the console.

// Purely decodes the second part of the JWT to inspect the payload without signature verification; this is for debugging only (the actual verification is performed by calling the LINE /verify endpoint below).
function peekJwtPayload(token) {
  try {
    const part = token.split('.')[1];
    const json = Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function verifyLineIdToken(idToken, channelId) {
  if (!idToken) throw new Error('缺少 idToken');
  if (!channelId) throw new Error('伺服器未設定 LINE_CHANNEL_ID');
  const trimmedChannelId = String(channelId).trim();

  const res = await fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ id_token: idToken, client_id: trimmedChannelId }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const peek = peekJwtPayload(idToken);
    const debugInfo = peek ? ` ｜token裡的aud=${JSON.stringify(peek.aud)}, iss=${peek.iss} ｜送出的client_id=${JSON.stringify(trimmedChannelId)}(長度${trimmedChannelId.length})` : ' ｜(token無法解析)';
    throw new Error(`LINE token 驗證失敗 (${res.status})：${text.slice(0, 200)}${debugInfo}`);
  }

  const payload = await res.json();
  // payload.sub = LINE user unique ID, payload.name / payload.picture are the display name and avatar URL
  if (!payload.sub) throw new Error('LINE token 驗證結果缺少使用者 ID');
  return payload;
}
