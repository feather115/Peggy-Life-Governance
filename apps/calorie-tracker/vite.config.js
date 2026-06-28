import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { searchFood } from './api/_groqFoodSearch.js'
import { generateDaySummary } from './api/_groqDaySummary.js'

// 本機開發時模擬 Vercel serverless functions（/api/*），
// 讓 GROQ_API_KEY 只存在伺服器端（從 .env 讀），不會打包進前端
function devApiRoute(path, handler) {
  return (server) => {
    server.middlewares.use(path, (req, res) => {
      if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body || '{}');
          const result = await handler(payload, process.env.GROQ_API_KEY);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));
        } catch (e) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: e.message || '請求失敗' }));
        }
      });
    });
  };
}

function groqDevApi() {
  return {
    name: 'groq-dev-api',
    configureServer(server) {
      devApiRoute('/api/food-search', ({ query }, key) => searchFood(query, key))(server);
      devApiRoute('/api/day-summary', (body, key) => generateDaySummary(body, key).then((summary) => ({ summary })))(server);
    },
  };
}

export default defineConfig(({ mode }) => {
  // loadEnv 讀 .env 但不限定 VITE_ 前綴，這樣 GROQ_API_KEY 才能進到 process.env（給上面的開發中介層用）
  const env = loadEnv(mode, process.cwd(), '')
  process.env.GROQ_API_KEY = env.GROQ_API_KEY

  return {
    plugins: [react(), groqDevApi()],
    server: { port: 3456 }
  }
})
