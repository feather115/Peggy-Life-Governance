// Vercel serverless function — 把目前登入的帳號跟 LINE 身份綁定
import { linkLineAccount } from './_lineLink.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { idToken, accessToken } = req.body || {};
    const result = await linkLineAccount(idToken, process.env.LINE_CHANNEL_ID, accessToken);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message || '連結失敗' });
  }
}
