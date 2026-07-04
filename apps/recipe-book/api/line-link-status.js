// Vercel serverless function — Checks whether the currently logged-in account already has a LINE identity linked.
import { checkLineLinkStatus } from './_lineLinkStatus.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { accessToken } = req.body || {};
    const result = await checkLineLinkStatus(accessToken);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message || '查詢失敗' });
  }
}
