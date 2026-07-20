# 食譜紀錄網站 — 架構說明

> 給未來的自己（和 AI 助理）：要改某個東西時，先看這份表找到對應檔案，**不用讀整個專案**。

---

## 一句話總覽

Vite + React 19 單頁 App：瀏覽與**管理**食譜（搜尋、分類、擁有者/分享篩選、按讚、
新增/編輯/刪除食譜、料理行事曆、配方縮放、長按標記完成），支援訪客模式（只能看分享的食譜）。
畫面分三個分頁（食譜 / 行事曆 / 設定）＋ 食譜編輯表單。
資料存在 Supabase（`recipe_book` schema，4 張表，見下方「資料庫結構」），RLS 控管
「訪客只看分享的、登入者多看自己的、只能改自己的」。
Supabase client 由 `@peggy-life/shared` 的 `createAppSupabase({ schema: 'recipe_book' })` 建立。

---

## 資料流

```
Supabase ⇄ db.js ⇄ useRecipes.js ⇄ App.jsx ⇄ components/*
           (純 API)  (狀態+動作)     (協調)     (畫面)
```

- 元件**不會**直接呼叫 `db.js`。`useRecipes()` 一次提供所有 state 和 action（跟 calorie-tracker 的 `useAppData`、calendar 的 `useEvents`/`useDiary`/`useTasks` 同一套模式）。
- `Root.jsx` 負責：LINE 自動登入與 Supabase Auth 登入閘口、訪客模式切換。
- `App.jsx` 負責行動版外殼（maxWidth 520px）、三個分頁（食譜/行事曆/設定）切換、
  `RecipeCatalog` ↔ `RecipeDetail` 的 view 導覽與返回、`RecipeForm` 的開關。

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
| **Supabase 查詢（食譜 CRUD、按讚、料理紀錄、暱稱）** | `src/db.js` |
| **Supabase client 連線** | `src/supabase.js`（re-export `@peggy-life/shared`） |
| **LINE LIFF 初始化與登入** | `src/liff.js`（薄殼，邏輯在 `packages/shared/src/lineAuth.js`，三 app 共用） |
| **新增/編輯食譜表單**（食材分區、步驟、參數、分享 checkbox） | `src/components/RecipeForm.jsx` |
| **料理行事曆**（月曆、記錄料理、備註） | `src/components/CookCalendar.jsx` |
| **底部分頁列**（訪客模式會隱藏行事曆/設定） | `src/components/TabBar.jsx` |
| **Email/密碼與 LINE 自動登入閘口** | `src/Root.jsx` |
| **Email 登入/註冊/重設密碼頁面** | `src/components/Auth.jsx` |
| **設定頁（暱稱、LINE 帳號連結、登出）** | `src/components/SettingsTab.jsx` |
| **URL 同步（?recipe=xxx 支援直連）** | `src/useRecipes.js` → `syncViewWithUrl()` / `openRecipeDetail()` |
| **主頁外殼與載入中畫面** | `src/App.jsx` |

---

## 每個檔案在幹嘛

### 核心
- **`src/main.jsx`** — 進入點，呼叫 `initLiff()` 完成後掛載 `<Root/>`。
- **`src/Root.jsx`** — 檢查 `.env` → 執行 LINE 自動登入 / Auth 驗證 → 已登入則載入 `<App/>`。
- **`src/App.jsx`** — 行動載具外殼（`maxWidth: 520`），載入 `useRecipes()` 並切換 `RecipeCatalog` / `RecipeDetail`。
- **`src/useRecipes.js`** — ⭐ **狀態中樞**。載入食譜、搜尋/分類篩選、catalog ↔ detail 導覽（含 URL 同步 `?recipe=xxx`）、
  按讚 `likeCounts`/`myLikedSet`/`likerNamesByRecipe`（誰按讚的名字清單，見下方設計重點）。
- **`src/liff.js`** — 薄殼：把本 app 的 supabase client 綁進 `@peggy-life/shared/lineAuth`
  的 `createLineAuth()`（三個 app 共用同一份 LINE 邏輯，要改行為去 `packages/shared/src/lineAuth.js`
  改）。提供 `initLiff()`、`lineAutoLogin()`、`canLinkLine()`、`retryLineAuthorization()`
  （重新跳 LINE 授權同意畫面，`Auth.jsx` 用）、`linkLineAccount()`、`checkLineLinked()`
  （給 `SettingsTab.jsx` 的 `LineLinker` 用）。**`@line/liff` 是動態 import**：只有「有設
  `VITE_LIFF_ID` 且 user agent 含 `Line/`」才會下載 liff SDK，一般瀏覽器完全不載入。
- **`src/db.js`** — Supabase 的純 CRUD 函式（食譜 CRUD、按讚、料理紀錄、`loadDisplayNames`/`updateDisplayName`）。
  **所有寫入都會檢查 `error` 並 throw**，由呼叫端（`useRecipes`）決定怎麼處理（跟 calorie-tracker 的 db.js 同一條規則）。
- **`src/supabase.js`** — re-export `@peggy-life/shared` 的 supabase client（`schema: 'recipe_book'`）。

### 畫面與組件（`src/components/`）
- **`RecipeCatalog.jsx`** — 食譜清單：頂部 header（Peggy logo + 登出按鈕 + 食譜數）、搜尋欄、分類 tab、雙欄食譜網格。全 inline styles。
- **`RecipeDetail.jsx`** — 食譜詳情：返回按鈕、食材、工序、心得、重點參數、按讚/誰按讚。全 inline styles。
- **`RecipeForm.jsx`** — 新增/編輯食譜表單：標題、分類、食材（含分區/品牌）、步驟、心得、參數、`is_shared` checkbox、刪除。
- **`CookCalendar.jsx`** — 料理行事曆分頁：月曆格、點日期記錄「今天做了哪道菜」（可加備註）、點紀錄跳食譜詳情。
- **`TabBar.jsx`** — 底部分頁列（食譜/行事曆/設定），訪客模式隱藏後兩個。
- **`Auth.jsx`** — 登入介面：Email + 密碼登入、註冊、忘記密碼。與 calorie-tracker 風格一致。
- **`SettingsTab.jsx`** — 設定分頁（`TabBar` 第三個 tab，訪客模式隱藏）：帳號 email（LINE
  登入的假 email 遮罩成 `LINE: U1234...wxyz`）、暱稱輸入框+儲存（呼叫 `useRecipes.js` 的
  `setMyDisplayName`，寫入 `shared.user_profiles.display_name`——**跨 app 共用**，在
  calorie-tracker 設過的暱稱這裡看得到，反過來也一樣，見下方「暱稱跨 app 共用」）、
  `LineLinker`（內部元件，跟 calorie-tracker/calendar 的 `LineLinker` 同一套設計：
  `checkLineLinked()` 查到已連結會快取進 `localStorage`，避免畫面閃爍；「連結 LINE
  帳號」按鈕只有 `canLinkLine()` 為 true 才顯示）、登出按鈕。

---

## Schema 隔離

食譜資料存在 Supabase 的 `recipe_book` schema（與 calorie-tracker 的 `calorie_tracker` schema 隔開）。

| Schema | 內容 |
|---|---|
| `recipe_book` | `recipes`、`recipe_likes`、`cooking_history`、`user_settings`（已停用）共 4 張表 |
| `shared` | 三個 app 共用：`line_links`（LINE 帳號對照）、`user_profiles`（暱稱） |
| `auth` | 共用 `auth.users`（三個 app 同一個 Supabase 專案） |

前端 supabase client 透過 `db.schema = 'recipe_book'` 自動路由，`from('recipes')` 會指向 `recipe_book.recipes`。

**Supabase Settings → Integrations → Data API → Exposed schemas 必須包含 `recipe_book`**，否則 PostgREST 會回 404。

**Schema 隔離 migration**：[`2026-06-28_schema_isolation.sql`](./supabase/2026-06-28_schema_isolation.sql)
- `create schema recipe_book` + grant usage
- `alter table public.recipes set schema recipe_book`（索引、RLS、policy 跟著走）
- grant select + alter default privileges（給 anon/authenticated）

---

## 資料庫結構（Supabase）

4 張表：`recipes`（食譜本身）+ `recipe_likes`（按讚）+ `cooking_history`（料理行事曆紀錄）+ `user_settings`（**已停用**）。

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
- **分享狀態**：`is_shared` 由 `RecipeForm.jsx` 編輯頁面的 checkbox 控制（用 `saveRecipe` 一起 update）。
- **JSON 匯入**：`RecipeForm.jsx` 支援以字串或陣列形式匯入 `yield_info`；介面範例使用陣列呈現多筆份量/產出資訊。
- **Catalog 擁有權篩選**：登入者可勾選 `我的私房 / 我已分享 / 大家分享` 三種類別（**多選**，`useRecipes.ownershipFilter` 是 `Set`，`toggleOwnership()` 切換並存進 `localStorage` 記住偏好），`filterRecipes` 用 `ownershipSet + currentUserId` 過濾；訪客因 RLS 天生只拿得到 `others_shared`。
- **按讚與喜愛排序**：`recipe_likes` 表存按讚紀錄，`useRecipes` 算出 `likeCounts` / `myLikedSet`。RecipeDetail 顯示按讚數＋按讚按鈕（擁有者只見數字、訪客只見數字、登入者可 toggle）；catalog 卡片右上角顯示 ❤️ N 計數；`filterRecipes` 把我喜愛的食譜排在每個分頁的最前面。
- **「誰按讚」顯示名字**：`shared.user_profiles`（`display_name`/`email`，見下方「暱稱跨
  app 共用」）搭配 `useRecipes` 的 `likerNamesByRecipe`（`Map<recipeId, string[]>`），在
  RecipeDetail 的按讚區塊下方列出「小明、小華 按讚」。名字解析邏輯在 `utils.js` 的
  `displayNameFor()`：有自訂暱稱就用暱稱，沒有就退回 email 本地部分，LINE 登入的假
  email（`line-<sub>@line.invalid`）一律顯示「LINE 使用者」。暱稱可以在 `SettingsTab.jsx`
  自己設定（`setMyDisplayName` → `db.updateDisplayName`）。
- **暱稱跨 app 共用**：`shared.user_profiles` 是 calorie-tracker / recipe-book / calendar
  共用的暱稱表（跟 `shared.line_links` 同一個概念），在任一個 app 改暱稱，其他 app 立刻
  看到同一個名字。這個 app 自己的 `recipe_book.user_settings` 表（`2026-07-04_recipe_book_user_settings.sql`
  建的）**已經不再使用**，是被 `shared.user_profiles` 取代前的第一版做法，留著沒刪
  純粹因為刪一張空表不值得為此再寫一支 migration，之後如果要徹底清乾淨可以連表一起砍。
  詳細設計見 `apps/calorie-tracker/ARCHITECTURE.md` 的「暱稱跨 app 共用」章節（權威說明
  放在那邊，因為 calorie-tracker 的挑戰賽排行榜是第一個依賴這張表的功能）。
- **`ingredients` 支援兩種格式**：新格式是物件陣列 `[{ name, amount, ... }]`，舊格式是 `{ name: amount }` 物件。`utils.js` 的 `parseIngredients()` 統一處理。
- **`steps` 支援三種格式**：物件陣列、字串陣列、單一字串（換行分隔）。`parseSteps()` 統一處理。
- **`is_base` 標記主食材**——配方縮放用。輸入主食材的新重量後，其他食材依比例換算。

### `recipe_likes`（`supabase/2026-06-28_recipe_likes.sql`）

| 欄位 | 型別 | 用途 |
|---|---|---|
| `id` | uuid (PK) | 主鍵 |
| `user_id` | uuid → `auth.users(id)` | 按讚者（CASCADE） |
| `recipe_id` | bigint → `recipe_book.recipes(id)` | 食譜（CASCADE） |
| `created_at` | timestamptz | 按讚時間 |

UNIQUE `(user_id, recipe_id)` — 同一人對同一食譜只能按一次。
RLS：select 對任何人（含 anon）開放，讓按讚總數所有人都看得到；insert/delete 只能對自己的列。
前端 `loadAllLikes()` 一次抓全部，client 端 group 出 `likeCounts: Map<recipeId, number>` 和 `myLikedSet: Set<recipeId>`。資料小、量不會爆，不值得加 RPC。

### `user_settings`（`supabase/2026-07-04_recipe_book_user_settings.sql`）— **已停用，不要再用**

這張表是暱稱功能的第一版，只在 recipe-book 自己的 schema 裡，跟 calorie-tracker 的暱稱
是兩份互不相通的資料。上線沒多久就改成跨 app 共用的 `shared.user_profiles`（見上方「暱稱
跨 app 共用」），現在 `db.js` 已經不會再讀寫這張表了。表本身、它的 `on_auth_user_created_recipe_book`
trigger、`public.handle_new_user_recipe_book()` function 都還留著（刪一張空表不值得
再寫一支 migration），如果之後要徹底清乾淨可以連 trigger 一起砍。

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

#### `last_cooked_at` 同步邏輯
- **前端推導**：在 `useRecipes.js` 中使用 `recipesWithLastCooked` 動態計算每道食譜對應當前登入使用者的最新烹調日期（`cooked_date`），藉此達到即時、個別使用者隔離的「上次製作時間」顯示與排序。
- **資料庫寫回**：當使用者在行事曆中新增或刪除某筆烹調紀錄時，若該食譜為使用者本人所有（即 `user_id === auth.uid()`），前端會同時重新計算該食譜在行事曆中的最晚日期，並非同步呼叫 `db.updateRecipe()` 將其寫回 `recipes.last_cooked_at` 欄位以保持資料庫同步。

> **重要**：`recipe_id` 是 `bigint`，必須跟 `recipes.id` 型別一致，FK 才建得起來。

#### LINE 綁定共享機制
為了避免使用者在 calorie-tracker、recipe-book、calendar 三個 app 之間面臨重複的 LINE 帳號連結動作，
`recipe-book` 後端 API（`api/_supabaseAdmin.js` 的 `getSupabaseAdminForLine()`）指向獨立的
`shared.line_links` 表，跟另外兩個 app 共用同一份 LINE 使用者對照清單。只要在任一個 app 連結過
LINE，其他 app 就能即時識別並支援 LINE 自動免密碼登入。

`api/` 底下跟 LINE 有關的檔案：`_lineLogin.js`/`line-login.js`（LIFF 自動登入）、
`_lineLink.js`/`line-link.js`（把目前登入的帳號綁定到這個 LINE 身份）、
`_lineLinkStatus.js`/`line-link-status.js`（查詢目前帳號是否已綁定，給
`SettingsTab.jsx` 的 `LineLinker` 顯示「已連結」狀態用）、`_lineVerify.js`
（驗證 LINE ID token）、`_supabaseAdmin.js`（admin client 工廠）。

> **跨 app 一致性**：這些檔案三個 app **逐字相同**（Vercel serverless 必須每個 app 各放
> 一份，改任何一份要同步另外兩份），唯一因 app 而異的是 `_supabaseAdmin.js` 的
> `getSupabaseAdmin()` schema（這裡是 `recipe_book`）。`_lineLogin.js` 首次 LINE 登入
> 會把 LINE 顯示名稱 seed 進 `shared.user_profiles`（僅暱稱空白時），「誰按讚」跟設定頁
> 的暱稱直接受惠。

`line_links` 曾經放在 `calorie_tracker` schema（2026-06-29 回退），2026-07-01 找到 Supabase
的 `PGRST106` exposed-schema bug 正確修法後搬回 `shared`，詳見根目錄
[`docs/new-app-sop.md`](../../docs/new-app-sop.md) 第 3 節。

---

## Migration 檔案清單（`supabase/`）

| 檔案 | 做什麼 |
|---|---|
| `schema.sql` | 建 `recipes` 表 + GIN 索引 + RLS + select policy（建在 `public`） |
| `2026-06-28_schema_isolation.sql` | 把 `recipes` 從 `public` 搬到 `recipe_book` schema |
| `2026-06-28_recipe_cook_records.sql` | 建 `recipe_book.cooking_history` 表（料理行事曆紀錄）+ RLS + 索引 |
| `2026-06-28_recipe_ownership.sql` | 加 `user_id` / `is_shared` 欄位、backfill 舊食譜給 feather115、重寫 RLS（讀: 分享或擁有；寫: 只有擁有者） |
| `2026-06-28_recipe_rls_hotfix.sql` | 動態 drop 掉 recipe_book.recipes 上所有殘留的 SELECT policy 再重建 — 跑 ownership migration 後若訪客還是看得到全部食譜就跑這支 |
| `2026-06-28_recipe_likes.sql` | 建 `recipe_book.recipe_likes` 表（按讚 / 喜愛排序用）+ RLS（select 公開、寫入只能對自己） |
| `2026-07-04_recipe_book_user_settings.sql` | 建 `recipe_book.user_settings` 表（暱稱/email 第一版，**現已停用**，見上方說明） |
| `packages/shared/supabase/2026-07-06_shared_user_profiles.sql` | 建 `shared.user_profiles`（跨 app 共用暱稱，取代上一支），這個 app 的「誰按讚」跟 `SettingsTab.jsx` 的暱稱都改讀寫這張表 |
| `packages/shared/supabase/2026-07-06_user_profiles_service_role_grant.sql` | 補 `shared.user_profiles` 對 `service_role` 的表權限（LINE 首次登入的暱稱 seed 需要） |

> 新環境順序：`schema.sql` → 在 Supabase Exposed schemas 加 `recipe_book` → `2026-06-28_schema_isolation.sql` → `2026-06-28_recipe_cook_records.sql` → `2026-06-28_recipe_ownership.sql` → `2026-06-28_recipe_rls_hotfix.sql` → `2026-06-28_recipe_likes.sql` → `2026-07-04_recipe_book_user_settings.sql`（可省略，已停用，但為了 `shared_user_profiles` 的 backfill 邏輯還是建議跑）→ `packages/shared/supabase/2026-07-06_shared_user_profiles.sql`。

---

## 特殊互動

### 配方等比例縮放
`RecipeDetail.jsx` 裡有一個輸入框可以填入主食材（`is_base: true`）的新重量（克），所有食材的數量會依比例即時換算。重設按鈕清空輸入恢復原始值。縮放只影響畫面顯示，不改 DB。

### 長按標記完成
食材、步驟、心得都支援長按 700ms 標記完成（加刪除線）。狀態存在 React state（`completedItems`），離開頁面就重設，不存 DB。
