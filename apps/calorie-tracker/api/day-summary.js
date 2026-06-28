// Vercel serverless function — for production use. GROQ_API_KEY is configured in Vercel project environment variables and will not be bundled into the frontend.
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
