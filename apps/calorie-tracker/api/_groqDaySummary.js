// Formats the day's diet log into text and passes it to Groq to generate a brief comment/suggestion.
import { callGroq } from './_groq.js';

const SYSTEM_PROMPT = `你是親切但專業的營養顧問。使用者會給你今天吃的食物清單、總熱量/三大營養素、目標值、以及今天標記的斷食方式/特殊狀況標籤。
用繁體中文寫 1-2 句「非常簡短」的評語：先講今天表現如何，再給最多 1 個具體建議。如果有斷食或聚餐/外食等標籤，納入評語的判斷（例如斷食中熱量低是正常的，不用建議多吃；聚餐/放縱日超標也不用太苛責）。
語氣自然、口語化、像朋友隨口提醒，不要條列、不要標題、不要加引號，直接輸出這段文字，越精簡越好。`;

export async function generateDaySummary({ meals, totals, goal, tags }, apiKey) {
  if (!meals || meals.length === 0) throw new Error('今天還沒有記錄任何餐點，沒東西可以分析');

  const mealsText = meals.map((m) => `${m.label}：${m.items.map((i) => `${i.name}(${i.cal}kcal)`).join('、') || '沒吃'}`).join('\n');
  const tagsText = tags && tags.length > 0 ? `\n今天的標籤：${tags.join('、')}` : '\n今天沒有特別標記任何標籤';
  const userContent = `今天吃的：\n${mealsText}\n\n總計：熱量 ${totals.cal} kcal（目標 ${goal.cal}）、蛋白質 ${totals.p}g（目標 ${goal.p}）、碳水 ${totals.c}g（目標 ${goal.c}）、脂肪 ${totals.f}g（目標 ${goal.f}）${tagsText}`;

  const content = await callGroq(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    { apiKey, temperature: 0.6 }
  );
  return content.trim();
}
