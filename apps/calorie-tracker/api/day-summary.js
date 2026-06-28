// Vercel serverless function — 正式環境用。GROQ_API_KEY 在 Vercel 專案環境變數設定，不會打包進前端。
import { generateDaySummary } from './_groqDaySummary.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const summary = await generateDaySummary(req.body || {}, process.env.GROQ_API_KEY);
    res.status(200).json({ summary });
  } catch (e) {
    res.status(400).json({ error: e.message || '產生摘要失敗' });
  }
}
