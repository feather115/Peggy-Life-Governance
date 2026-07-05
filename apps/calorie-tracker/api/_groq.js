// Shared: Low-level function to call Groq Chat Completions.
// GROQ_API_KEY must only be placed in server-side environment variables. Never prefix it with VITE_ (which would bundle and expose it in the frontend).

export async function callGroq(messages, { apiKey, jsonMode = false, temperature = 0.3 } = {}) {
  if (!apiKey) throw Object.assign(new Error('伺服器未設定 GROQ_API_KEY'), { statusCode: 500 });

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
