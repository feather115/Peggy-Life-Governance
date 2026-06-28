# peggy-life

Monorepo，包含兩個獨立的 app，各自部署到不同的 Vercel 專案。

## Apps

- [`apps/calorie-tracker`](./apps/calorie-tracker) — 飲食卡路里記錄 app（React + Vite + Supabase）
- [`apps/recipe-book`](./apps/recipe-book) — 食譜紀錄網站（Vue + Vite + Supabase）

每個 app 的設定、開發、部署細節請看各自資料夾裡的 README。

## 安裝

```bash
npm install
```

會用 npm workspaces 一次裝好兩個 app 的依賴。

## 開發

```bash
npm run dev:calorie-tracker
npm run dev:recipe-book
```

或直接進到 `apps/<app>` 資料夾跑 `npm run dev`。

## 部署到 Vercel

兩個 app 各自建立獨立的 Vercel 專案，連到同一個 GitHub repo，並在專案設定的
**Root Directory** 分別指向：

- `apps/calorie-tracker`
- `apps/recipe-book`

Vercel 會自動偵測 Root Directory 下的 `package.json` 並只建置該 app，互不影響。
記得在各自的 Vercel 專案環境變數中設定對應的 `.env` 內容（不要 commit `.env`）。
