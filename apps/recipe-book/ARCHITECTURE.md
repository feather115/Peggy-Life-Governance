# 食譜紀錄網站 — 架構說明

> 給未來的自己（和 AI 助理）：要改某個東西時，先看這份表找到對應檔案，**不用讀整個專案**。

---

## 一句話總覽

Vite + React 19 單頁 App，唯讀瀏覽 Peggy 的食譜（搜尋、分類、食材配方縮放、長按標記完成）。
資料存在 Supabase（`recipe_book.recipes` 表），前端用 `anon` key 唯讀存取，寫入靠 SQL Editor 或 service_role 手動匯入。
Supabase client 由 `@peggy-life/shared` 的 `createAppSupabase({ schema: 'recipe_book' })` 建立。

---

## 資料流

```
Supabase ⇄ db.js ⇄ useRecipes.js ⇄ App.jsx ⇄ Root.jsx (Auth gate / LIFF)
                                              └── Auth.jsx
```

- 元件**不會**直接呼叫 `db.js`。`useRecipes()` 一次提供所有 state 和 action。
- `Root.jsx` 負責：LINE LIFF 初始化、LINE 自動登入與 Supabase Auth 登入閘口。
- `App.jsx` 負責裝載行動版的外殼（maxWidth 520px），並依 `currentView` 控制 `RecipeCatalog` / `RecipeDetail` 兩個 view 的切換與返回。

---

## 檔案地圖 — 「我要改 X，該開哪個檔？」

| 你想改的東西 | 檔案 |
|---|---|
| **食譜清單（搜尋框、分類 tab、卡片網格、登出鈕）** | `src/components/RecipeCatalog.jsx` (Inline styles) |
| **單一食譜詳情（返回鈕、食材、步驟、心得、參數）** | `src/components/RecipeDetail.jsx` (Inline styles) |
| **配方等比例縮放** | `src/components/RecipeDetail.jsx` → `getScaledAmount()` |
| **長按標記完成** | `src/components/RecipeDetail.jsx` → `startLongPress()` / `pressHandlers()` |
| **搜尋 / 分類篩選邏輯** | `src/utils.js` → `filterRecipes()` / `getAvailableCategories()` |
| **食譜欄位正規化（ingredients/steps/notes/parameters 的各種格式）** | `src/utils.js` → `normalizeRecipe()` / `parseIngredients()` / `parseSteps()` / `parseNotes()` |
| **食材 / 步驟依 type 分組** | `src/utils.js` → `groupItemsByType()` / `groupStepsByType()` |
| **日期格式** | `src/utils.js` → `formatDate()` |
| **Supabase 查詢（目前只有 loadRecipes）** | `src/db.js` |
| **Supabase client 連線** | `src/supabase.js`（re-export `@peggy-life/shared`） |
| **LINE LIFF 初始化與登入** | `src/liff.js` |
| **Email/密碼與 LINE 自動登入閘口** | `src/Root.jsx` |
| **Email 登入/註冊/重設密碼頁面** | `src/components/Auth.jsx` |
| **URL 同步（?recipe=xxx 支援直連）** | `src/useRecipes.js` → `syncViewWithUrl()` / `openRecipeDetail()` |
| **主頁外殼與載入中畫面** | `src/App.jsx` |

---

## 每個檔案在幹嘛

### 核心
- **`src/main.jsx`** — 進入點，呼叫 `initLiff()` 完成後掛載 `<Root/>`。
- **`src/Root.jsx`** — 檢查 `.env` → 執行 LINE 自動登入 / Auth 驗證 → 已登入則載入 `<App/>`。
- **`src/App.jsx`** — 行動載具外殼（`maxWidth: 520`），載入 `useRecipes()` 並切換 `RecipeCatalog` / `RecipeDetail`。
- **`src/useRecipes.js`** — ⭐ **狀態中樞**。載入食譜、搜尋/分類篩選、catalog ↔ detail 導覽（含 URL 同步 `?recipe=xxx`）。
- **`src/liff.js`** — LINE LIFF 初始化、LINE 自動登入及帳號綁定。
- **`src/db.js`** — Supabase 的純查詢函式（`loadRecipes`）。
- **`src/supabase.js`** — re-export `@peggy-life/shared` 的 supabase client（`schema: 'recipe_book'`）。

### 畫面與組件（`src/components/`）
- **`RecipeCatalog.jsx`** — 食譜清單：頂部 header（Peggy logo + 登出按鈕 + 食譜數）、搜尋欄、分類 tab、雙欄食譜網格。全 inline styles。
- **`RecipeDetail.jsx`** — 食譜詳情：返回按鈕、食材、工序、心得、重點參數。全 inline styles。
- **`Auth.jsx`** — 登入介面：Email + 密碼登入、註冊、忘記密碼。與 calorie-tracker 風格一致。

---

## Schema 隔離

食譜資料存在 Supabase 的 `recipe_book` schema（與 calorie-tracker 的 `calorie_tracker` schema 隔開）。

| Schema | 內容 |
|---|---|
| `recipe_book` | `recipes` 表 |
| `auth` | 共用 `auth.users`（兩個 app 同一個 Supabase 專案） |

前端 supabase client 透過 `db.schema = 'recipe_book'` 自動路由，`from('recipes')` 會指向 `recipe_book.recipes`。

**Supabase Settings → Integrations → Data API → Exposed schemas 必須包含 `recipe_book`**，否則 PostgREST 會回 404。

**Schema 隔離 migration**：[`2026-06-28_schema_isolation.sql`](./supabase/2026-06-28_schema_isolation.sql)
- `create schema recipe_book` + grant usage
- `alter table public.recipes set schema recipe_book`（索引、RLS、policy 跟著走）
- grant select + alter default privileges（給 anon/authenticated）

---

## 資料庫結構（Supabase）

兩張表：`recipes`（食譜本身，公開可讀）+ `cooking_history`（每個使用者的料理行事曆紀錄）。

### `recipes`（`supabase/schema.sql`）

| 欄位 | 型別 | 用途 |
|---|---|---|
| `id` | bigint (PK, identity) | 主鍵 |
| `user_id` | uuid → `auth.users(id)` | 擁有者（on delete set null） |
| `is_shared` | boolean | 是否分享給其他人（含未登入訪客）看，預設 false |
| `title` | text | 食譜名稱 |
| `category` | text[] | 多分類標籤（GIN 索引） |
| `ingredients` | jsonb | `[{ name, amount, unit, is_base, brand, type }]` |
| `steps` | jsonb | `[{ text, type, sort }]` |
| `notes` | text / jsonb | 心得備註（支援字串或字串陣列） |
| `image_url` | text | 食譜圖片 URL |
| `last_cooked_at` | timestamptz | 上次製作時間 |
| `yield_info` | jsonb | 份量/產出資訊（顯示為 badge） |
| `parameters` | jsonb | 動態製作參數（溫度、時間、配方比例等，key-value 顯示） |
| `created_at` | timestamptz | 建立時間 |
| `updated_at` | timestamptz | 更新時間 |

**設計重點：**
- **RLS 權限模型**（見 `2026-06-28_recipe_ownership.sql`）：
  - SELECT（含 `anon`）：`is_shared = true OR auth.uid() = user_id` ——訪客只看得到分享出來的，擁有者額外看得到自己未分享的。
  - INSERT / UPDATE / DELETE（只給 `authenticated`）：`auth.uid() = user_id` ——只能改自己的食譜。
- **訪客模式**：`Root.jsx` 提供「以訪客身分瀏覽」按鈕（不登入），App.jsx 把 `userId = null` 傳給 `useRecipes`，hook 跳過 `loadCookRecords`、`TabBar` 隱藏「行事曆」分頁。
- **分享按鈕**：`RecipeDetail.jsx` 對擁有者顯示 toggle（`is_shared` 反轉），呼叫 `db.setRecipeShared()` 直接 update。
- **`ingredients` 支援兩種格式**：新格式是物件陣列 `[{ name, amount, ... }]`，舊格式是 `{ name: amount }` 物件。`utils.js` 的 `parseIngredients()` 統一處理。
- **`steps` 支援三種格式**：物件陣列、字串陣列、單一字串（換行分隔）。`parseSteps()` 統一處理。
- **`is_base` 標記主食材**——配方縮放用。輸入主食材的新重量後，其他食材依比例換算。

### `cooking_history`（`supabase/2026-06-28_recipe_cook_records.sql`）

| 欄位 | 型別 | 用途 |
|---|---|---|
| `id` | uuid (PK) | 主鍵 |
| `user_id` | uuid → `auth.users(id)` | 使用者（CASCADE） |
| `recipe_id` | bigint → `recipe_book.recipes(id)` | 食譜（CASCADE） |
| `cooked_date` | date | 哪一天做的 |
| `created_at` | timestamptz | 寫入時間 |

UNIQUE `(user_id, cooked_date, recipe_id)` — 同一天同一道菜不會重複登記，前端 `addCookRecord` 用 upsert 處理。
RLS：每個人只能 select/insert/update/delete 自己 `user_id` 的列。

> **重要**：`recipe_id` 是 `bigint`，必須跟 `recipes.id` 型別一致，FK 才建得起來。

---

## Migration 檔案清單（`supabase/`）

| 檔案 | 做什麼 |
|---|---|
| `schema.sql` | 建 `recipes` 表 + GIN 索引 + RLS + select policy（建在 `public`） |
| `2026-06-28_schema_isolation.sql` | 把 `recipes` 從 `public` 搬到 `recipe_book` schema |
| `2026-06-28_recipe_cook_records.sql` | 建 `recipe_book.cooking_history` 表（料理行事曆紀錄）+ RLS + 索引 |
| `2026-06-28_recipe_ownership.sql` | 加 `user_id` / `is_shared` 欄位、backfill 舊食譜給 feather115、重寫 RLS（讀: 分享或擁有；寫: 只有擁有者） |
| `2026-06-28_recipe_rls_hotfix.sql` | 動態 drop 掉 recipe_book.recipes 上所有殘留的 SELECT policy 再重建 — 跑 ownership migration 後若訪客還是看得到全部食譜就跑這支 |

> 新環境順序：`schema.sql` → 在 Supabase Exposed schemas 加 `recipe_book` → `2026-06-28_schema_isolation.sql` → `2026-06-28_recipe_cook_records.sql` → `2026-06-28_recipe_ownership.sql` → `2026-06-28_recipe_rls_hotfix.sql`。

---

## 特殊互動

### 配方等比例縮放
`RecipeDetail.jsx` 裡有一個輸入框可以填入主食材（`is_base: true`）的新重量（克），所有食材的數量會依比例即時換算。重設按鈕清空輸入恢復原始值。縮放只影響畫面顯示，不改 DB。

### 長按標記完成
食材、步驟、心得都支援長按 700ms 標記完成（加刪除線）。狀態存在 React state（`completedItems`），離開頁面就重設，不存 DB。
