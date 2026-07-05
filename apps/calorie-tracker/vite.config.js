import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { searchFood } from './api/_groqFoodSearch.js'
import { generateDaySummary } from './api/_groqDaySummary.js'

// Simulates Vercel serverless functions (/api/*) during local development,
// keeping GROQ_API_KEY only on the server side (read from .env) and preventing it from being bundled into the frontend
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
          res.statusCode = e.statusCode || 400;
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
  // loadEnv reads .env without restricting to VITE_ prefix, so GROQ_API_KEY gets loaded into process.env (used by the dev middleware above)
  const env = loadEnv(mode, process.cwd(), '')
  process.env.GROQ_API_KEY = env.GROQ_API_KEY

  return {
    plugins: [react(), groqDevApi()],
    server: { port: 3456 }
  }
})
