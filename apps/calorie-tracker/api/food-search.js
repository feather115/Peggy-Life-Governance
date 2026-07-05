// Vercel serverless function — for production use. GROQ_API_KEY is configured in Vercel project environment variables,
// and will not be bundled into the frontend; the browser cannot access this key.
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
    res.status(e.statusCode || 400).json({ error: e.message || '查詢失敗' });
  }
}
