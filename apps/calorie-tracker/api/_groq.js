// 共用：呼叫 Groq Chat Completions 的最底層函式
// GROQ_API_KEY 只能放在伺服器端環境變數，絕對不要加 VITE_ 前綴（會被打包進前端 bundle 公開曝光）

export async function callGroq(messages, { apiKey, jsonMode = false, temperature = 0.3 } = {}) {
  if (!apiKey) throw new Error('伺服器未設定 GROQ_API_KEY');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      messages,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Groq API 錯誤 (${res.status})：${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq 沒有回傳結果');
  return content;
}
