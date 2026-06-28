# 食譜紀錄網站 Recipe Book

瀏覽與管理 Peggy 的食譜：依分類/關鍵字搜尋、檢視食材、步驟、製作參數與最後烹調時間。
資料存在 Supabase `recipes` 表，前端為 React 19 + Vite。

---

## 第一次設定

### 1. 安裝套件

在 monorepo 根目錄一次裝好所有 workspace：

```bash
npm install
```

### 2. 設定 Supabase

1. 到 [supabase.com](https://supabase.com) 建立一個新專案（或沿用 calorie-tracker 用的同一個 —— 兩個
   app 用同一個 Supabase 專案、共用使用者池，但資料表在不同的 schema 隔開）
2. **Settings → API → Exposed schemas** 加上 `recipe_book`（如果還沒加），儲存後等 30 秒
3. 左側 **SQL Editor** → 貼上 [`supabase/schema.sql`](./supabase/schema.sql) → **Run**（建 `recipes` 表）
4. 再貼 [`supabase/2026-06-28_schema_isolation.sql`](./supabase/2026-06-28_schema_isolation.sql) → **Run**
   （把 `recipes` 從 `public` 搬到 `recipe_book` schema）
5. 左側 **Settings → API**，複製 `Project URL` 和 `anon public` key
6. 複製 `.env.example` 成 `.env`，填入：
   ```
   VITE_SUPABASE_URL=https://你的專案.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

---

## 開發

從 monorepo 根目錄：

```bash
npm run dev:recipe-book
```

或進到本資料夾跑 `npm run dev`。

---

## 部署到 Vercel

1. 建立新的 Vercel 專案，連到本 monorepo
2. **Settings → Root Directory** 設成 `apps/recipe-book`
3. **Environment Variables** 補上 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`

Vercel 會用本資料夾的 `package.json` 自動偵測 Vite，不影響其他 app。

---

## 程式結構

對齊 calorie-tracker 的慣例：`main.jsx → Root.jsx → App.jsx → components/`，狀態集中在
`useRecipes.js`，純函式在 `utils.js`，Supabase 查詢在 `db.js`，Supabase client 走共用
`@peggy-life/shared`。

```
src/
├── main.jsx                       # 進入點
├── Root.jsx                       # config check + 載入 recipes，再餵給 App
├── App.jsx                        # catalog/detail 切換
├── supabase.js                    # re-export 共用 supabase client
├── db.js                          # Supabase 查詢（loadRecipes）
├── utils.js                       # normalize / filter / parse / formatDate
├── useRecipes.js                  # 狀態中樞（清單、搜尋、分類、view 導覽）
├── style.css                      # 全域樣式
└── components/
    ├── RecipeCatalog.jsx + .css   # 食譜清單、搜尋、分類 tab
    └── RecipeDetail.jsx + .css    # 單一食譜的食材、步驟、參數頁
```
