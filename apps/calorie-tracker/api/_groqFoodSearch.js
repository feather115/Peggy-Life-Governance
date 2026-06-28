// 把一句自然語言描述轉成食物欄位
// 被 api/food-search.js（Vercel serverless，正式環境）和 vite.config.js 的開發中介層（本機開發）共用

import { callGroq } from './_groq.js';

const SYSTEM_PROMPT = `你是食物營養資料庫。使用者會用自然語言描述一個食物或餐點，你要估算出最合理的營養數值。
只能回傳一個 JSON 物件，格式如下，不要加任何其他文字、不要用 markdown code block：
{"name":"食物名稱","brand":"品牌或店家，沒有就空字串","unit":"份量，例如 1碗/100g/1份","cal":卡路里數字,"p":蛋白質克數,"c":碳水克數,"f":脂肪克數,"note":"簡短備註，沒有就空字串"}
數值都用合理估算，不要留 null，沒有就填 0。`;

export async function searchFood(query, apiKey) {
  if (!query || !query.trim()) throw new Error('請輸入要查詢的食物描述');

  const content = await callGroq(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: query.trim() },
    ],
    { apiKey, jsonMode: true, temperature: 0.2 }
  );

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Groq 回傳格式無法解析');
  }

  const cal = Number(parsed.cal);
  if (!parsed.name || isNaN(cal)) throw new Error('查詢結果缺少名稱或卡路里');

  return {
    name: String(parsed.name).trim(),
    brand: String(parsed.brand || '').trim(),
    unit: String(parsed.unit || '1 份').trim(),
    cal: Math.round(cal),
    p: Number(parsed.p) || 0,
    c: Number(parsed.c) || 0,
    f: Number(parsed.f) || 0,
    note: String(parsed.note || '').trim(),
  };
}
