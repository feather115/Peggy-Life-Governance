// Vercel serverless function — 接收 LIFF 前端的 LINE ID Token，驗證後回傳可交換 Supabase session 的憑證
import { loginWithLine } from './_lineLogin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { idToken } = req.body || {};
    const result = await loginWithLine(idToken, process.env.LINE_CHANNEL_ID);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message || 'LINE 登入失敗' });
  }
}
