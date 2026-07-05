// Vercel serverless function — Receives the LINE ID Token from LIFF frontend, verifies it, and returns credentials that can be exchanged for a Supabase session.
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
    console.error('[POST /api/line-login] failed:', JSON.stringify({ message: e.message, code: e.code, details: e.details, hint: e.hint }));
    res.status(e.statusCode || 400).json({ error: e.message || 'LINE 登入失敗', code: e.code, details: e.details, hint: e.hint });
  }
}
