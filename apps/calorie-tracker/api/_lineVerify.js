// 驗證 LIFF 前端送來的 LINE ID Token 是不是真的、沒被竄改
// LINE_CHANNEL_ID 是「LINE Login channel」的 Channel ID（公開的數字，不是密鑰），在 console 的 Basic settings 頁面可以找到

// 純粹拆 JWT 的第二段看內容，不驗證簽章，只是除錯用（真正的驗證還是交給下面呼叫 LINE 的 /verify）
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
  // payload.sub = LINE 使用者唯一 ID，payload.name / payload.picture 是顯示名稱/頭像
  if (!payload.sub) throw new Error('LINE token 驗證結果缺少使用者 ID');
  return payload;
}
