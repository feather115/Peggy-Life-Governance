// Converts a natural language description into structured food fields.
// Shared by api/food-search.js (Vercel serverless for production) and development middleware in vite.config.js (for local development).

import { callGroq } from './_groq.js';

const SYSTEM_PROMPT = `你是專業營養師，熟悉台灣衛生福利部食品營養成分資料庫、超商與連鎖餐飲品牌公開的營養標示。
使用者會用自然語言描述一個食物或餐點，你要根據這些可信依據估算最合理的營養數值，不要憑感覺亂猜、不要無故灌水或縮水。

若使用者沒有指定份量，用台灣常見的一般份量（例如白飯一碗約 200g、雞蛋一顆約 55g），並在 unit 欄位清楚寫出公克數或容量，不要只寫「1份」這種模糊字眼。

只能回傳一個 JSON 物件，不要加任何其他文字、不要用 markdown code block：
{"name":"食物名稱","brand":"品牌或店家，沒有就空字串","unit":"份量，例如 1碗(約200g)/100g/1杯(350ml)","cal":卡路里數字,"p":蛋白質克數,"c":碳水克數,"f":脂肪克數,"note":"簡短備註，沒有就空字串"}
數值都用合理估算，不要留 null，沒有就填 0。

參考範例（校準用，數值來自常見食品營養資料庫，不要照抄名稱，只用來抓數量級）：
輸入「白飯一碗」→ {"name":"白飯","brand":"","unit":"1碗(約200g)","cal":280,"p":5,"c":62,"f":0.5,"note":""}
輸入「雞胸肉100g」→ {"name":"雞胸肉","brand":"","unit":"100g","cal":110,"p":23,"c":0,"f":1.5,"note":"去皮"}
輸入「全家御飯糰鮪魚美奶滋」→ {"name":"御飯糰 鮪魚美奶滋","brand":"全家","unit":"1個(約110g)","cal":190,"p":5,"c":32,"f":5,"note":""}
輸入「珍珠奶茶半糖」→ {"name":"珍珠奶茶","brand":"","unit":"1杯(約700ml)","cal":450,"p":4,"c":85,"f":10,"note":"半糖"}`;

export async function searchFood(query, apiKey) {
  if (!query || !query.trim()) throw new Error('請輸入要查詢的食物描述');

  const content = await callGroq(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: query.trim() },
    ],
    { apiKey, jsonMode: true, temperature: 0 }
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
