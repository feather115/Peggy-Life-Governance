import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 各 app 固定各自的 dev port（calorie-tracker 3456 / calendar 3457 / recipe-book 5173），
  // 跟根目錄 .claude/launch.json 對齊，才能三個 app 同時開
  server: { port: 5173 },
});
