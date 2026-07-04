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
9. 再貼 [`supabase/2026-07-04_recipe_book_user_settings.sql`](./supabase/2026-07-04_recipe_book_user_settings.sql) → **Run**
   （建暱稱/email 對照表，給 detail 頁「誰按讚」顯示名字用）
10. 左側 **Settings → API**，複製 `Project URL` 和 `anon public` key
11. 複製 `.env.example` 成 `.env`，填入：
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
├── db.js                          # Supabase 查詢（食譜/按讚/料理紀錄/使用者暱稱 CRUD）
├── utils.js                       # normalize / filter / parse / formatDate / displayNameFor
├── useRecipes.js                  # 狀態中樞（清單、搜尋、分類、URL 同步、按讚、暱稱等）
└── components/
    ├── Auth.jsx                   # Email / 密碼與 LINE 快速登入頁面
    ├── TabBar.jsx                 # 底部導覽（食譜 / 行事曆 / 設定）
    ├── RecipeCatalog.jsx          # 食譜清單、搜尋、分類 tab（全 inline styles）
    ├── RecipeDetail.jsx           # 單一食譜的食材、步驟、參數、按讚、誰按讚（全 inline styles）
    ├── RecipeForm.jsx             # 新增/編輯食譜表單
    ├── CookCalendar.jsx           # 料理行事曆分頁
    └── SettingsTab.jsx            # 設定分頁：帳號、暱稱、LINE 連結、登出
```

---

## 近期更新 (Recent Updates)
- **食譜表單優化：支援編輯食材分區與品牌** (2026-06-28)：
  - 在 `RecipeForm.jsx` 中，將食材的編輯介面升級為獨立的卡片區塊。
  - 新增「類別/分區（如：主料、醬料）」與「品牌/備註（如：日式）」輸入欄位，讓使用者在編輯/新增食譜時能直接指定食材區域（例如：主料、醬料）與品牌/備註。
- **料理行事曆優化：點選式推薦選單與時間排序** (2026-06-28)：
  - 移除了傳統的下拉選單（`select`）與「加入」按鈕，改為**即時點選式推薦列表**。使用者可直接點選推薦列表中的食譜一鍵加入行事曆，無需多次點選。
  - 新增「🔍 輸入關鍵字搜尋料理...」輸入框，輸入關鍵字後列表會即時進行過濾推薦。
  - 推薦列表預設依據「最後烹調時間（`last_cooked_at`）」、「編輯時間（`updated_at`）」及「建立時間（`created_at`）」降序排序，將最近常做或剛修改的食譜顯示在最前列。
  - 當使用者在行事曆中新增或刪除烹調歷史時，系統會自動在前端與資料庫中同步更新對應食譜的「最後製作時間`last_cooked_at`」欄位。
  - 移除了行事曆日期格子內部顯示第一道料理名稱的設計，讓日曆畫面保持簡潔，僅保留日期與烹調數量角標。
  - 修正了在沒有新增行事曆料理紀錄時，食譜會因為無法推導出 `latestByRecipe` 而導致原本存在資料庫中的 `last_cooked_at` 被強制覆蓋為 `null` 的 Bug（已改為若無行事曆紀錄則自動 Fallback 回讀取資料庫原本的 `last_cooked_at`）。
- **共享 LINE 帳號綁定資料表** (2026-06-28)：
  - 修改了後端 Serverless API（`_supabaseAdmin.js`, `_lineLink.js`, `_lineLogin.js`），在處理 LINE 登入與帳號綁定時，改為與 `calorie-tracker` 共用 `calorie_tracker.line_links` 資料表。
  - 此調整可避免兩個 App 重複綁定與不對等狀態，只要在任一 App 綁定過 LINE，兩邊皆可自動識別並完成免密碼快速登入。
- **食譜清單卡片樣式優化** (2026-06-28)：
  - 移除了食譜清單中每張食譜卡片圖片下方的「分類標籤（如：點心、中式料理等）」顯示，讓食譜卡片視覺更加簡潔，僅保留圖片與食譜標題。
- **支援自動歸類「未分類」食譜** (2026-06-28)：
  - 在 `utils.js` 中新增了對無分類食譜的支援。若有食譜尚未設定分類，分類頁籤會自動新增一個「未分類」頁籤。
  - 點擊「未分類」頁籤時，能精準篩選出所有無分類、或分類為空陣列的食譜，方便整理。
- **料理行事曆版面調整：優先顯示紀錄與摺疊新增介面** (2026-06-28)：
  - 將當日已做料理紀錄清單移至最上方優先顯示，符合「先查看，後新增」的直覺。
  - 預設摺疊隱藏搜尋新增介面，僅呈現「＋ 記錄料理」按鈕。點選按鈕後展開搜尋框與推薦清單，並支援自動聚焦（`autoFocus`）輸入框以利直接輸入。
  - 點選推薦清單中的料理一鍵加入後，新增介面會自動收合，讓畫面保持整潔。
  - 提供「收起」按鈕支援手動摺疊新增面板。
- **料理行事曆紀錄功能擴充：支援新增備註與連結食譜詳情** (2026-06-28)：
  - 料理紀錄新增「📝 備註（`notes`）」文字輸入欄位（如：備註「少油」、「偏甜」等），使用者輸入後會自動於失去焦點（`Blur`）或按下 `Enter` 時存檔。
  - 今日已做料理清單中的圖片與標題設為可點擊連結，點擊後會自動切換至該食譜的詳細步驟說明頁面。
  - 優化返回機制：從行事曆點選進入食譜詳細頁面後，點選詳細頁面的「返回」按鈕會自動回到行事曆頁面。
