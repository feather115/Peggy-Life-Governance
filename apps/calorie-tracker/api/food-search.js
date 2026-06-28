// Vercel serverless function — 正式環境用。GROQ_API_KEY 在 Vercel 專案設定的環境變數裡設定，
// 不會被打包進前端，瀏覽器拿不到這個金鑰。
import { searchFood } from './_groqFoodSearch.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { query } = req.body || {};
    const result = await searchFood(query, process.env.GROQ_API_KEY);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message || '查詢失敗' });
  }
}
