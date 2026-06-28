# 食譜紀錄網站 Recipe Book

瀏覽與管理 Peggy 的食譜：依分類/關鍵字搜尋、檢視食材、步驟、製作參數與最後烹調時間。
資料存在 Supabase `recipes` 表，前端為 Vue 3 + Vite。

---

## 第一次設定

### 1. 安裝套件

在 monorepo 根目錄一次裝好所有 workspace：

```bash
npm install
```

### 2. 設定 Supabase

1. 到 [supabase.com](https://supabase.com) 建立一個新專案（或沿用 calorie-tracker 用的同一個）
2. 左側 **SQL Editor** → 貼上 [`supabase/schema.sql`](./supabase/schema.sql) 全部內容 → **Run**
3. **Settings → API**，複製 `Project URL` 和 `anon public` key
4. 複製 `.env.example` 成 `.env`，填入：
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

```
src/
├── App.vue                      # 頂層元件，切換 catalog/detail 兩個 view
├── main.js                      # Vue app 入口
├── style.css                    # 全域樣式（目前為空，樣式都在 component scoped）
├── components/
│   ├── RecipeCatalog.vue        # 食譜清單、搜尋、分類 tab
│   └── RecipeDetail.vue         # 單一食譜的食材、步驟、參數頁
├── composables/
│   ├── useRecipes.js            # 取得食譜列表
│   ├── useRecipeFilters.js      # 搜尋 + 分類篩選
│   ├── useRecipeNavigation.js   # catalog ↔ detail view 切換
│   └── useRecipeDetail.js       # 單一食譜的細節邏輯
├── services/
│   └── recipeService.js         # Supabase 查詢封裝
├── lib/
│   └── supabaseClient.js        # Supabase client 建立
└── utils/
    └── recipeData.js            # normalize / filter / categories
```
