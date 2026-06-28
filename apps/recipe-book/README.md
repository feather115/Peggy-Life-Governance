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
5. 再貼 [`supabase/2026-06-28_recipe_cook_records.sql`](./supabase/2026-06-28_recipe_cook_records.sql) → **Run**
   （建 `recipe_book.cooking_history` 表，給「料理行事曆」分頁用）
6. 再貼 [`supabase/2026-06-28_recipe_ownership.sql`](./supabase/2026-06-28_recipe_ownership.sql) → **Run**
   （加擁有者欄位 + 分享 flag + 重寫 RLS，把舊食譜歸到 `feather115@gmail.com`）
7. 再貼 [`supabase/2026-06-28_recipe_rls_hotfix.sql`](./supabase/2026-06-28_recipe_rls_hotfix.sql) → **Run**
   （清掉殘留的 SELECT policy，確保訪客只看得到分享過的食譜）
8. 再貼 [`supabase/2026-06-28_recipe_likes.sql`](./supabase/2026-06-28_recipe_likes.sql) → **Run**
   （建按讚表，給 detail 頁按讚 / catalog 喜愛排序用）
9. 左側 **Settings → API**，複製 `Project URL` 和 `anon public` key
10. 複製 `.env.example` 成 `.env`，填入：
   ```
   VITE_SUPABASE_URL=https://你的專案.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_LIFF_ID=12345678-abcdef  # (選填，若要在 LINE 裡面開啟並自動登入才需要設定)
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
3. **Environment Variables** 補上 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`，以及選填的 `VITE_LIFF_ID`

Vercel 會用本資料夾的 `package.json` 自動偵測 Vite，不影響其他 app。

---

## 程式結構

對齊 calorie-tracker 的慣例：`main.jsx → Root.jsx → App.jsx → components/`，狀態集中在
`useRecipes.js`，純函式在 `utils.js`，Supabase 查詢在 `db.js`，Supabase client 走共用
`@peggy-life/shared`。

```
src/
├── main.jsx                       # 進入點（初始化 LINE LIFF）
├── Root.jsx                       # config check + LIFF / Auth 登入閘口，登入後交給 App
├── App.jsx                        # 520px 行動外殼 + 載入 recipes 與 view 導覽切換
├── supabase.js                    # re-export 共用 supabase client
├── liff.js                        # LINE LIFF 初始化與自動登入/帳號綁定邏輯
├── db.js                          # Supabase 查詢（loadRecipes）
├── utils.js                       # normalize / filter / parse / formatDate
├── useRecipes.js                  # 狀態中樞（清單、搜尋、分類、URL 同步等）
└── components/
    ├── Auth.jsx                   # Email / 密碼與 LINE 快速登入頁面
    ├── RecipeCatalog.jsx          # 食譜清單、搜尋、分類 tab（全 inline styles）
    └── RecipeDetail.jsx           # 單一食譜的食材、步驟、參數頁，含返回按鈕（全 inline styles）
```
