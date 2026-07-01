# 新增一個 App 的 SOP

這份文件是照 `apps/calorie-tracker` 和 `apps/recipe-book` 兩個現有 app 的慣例整理出來的。
以後要在這個 monorepo 加第三個（或更多）app，照這個順序做，會自動跟現有兩個 app 風格一致，
AI 助理接手時也能立刻套用相同慣例，不用每次重新摸索。

新 app 開工前，先確認：**這個 app 需要什麼？**（登入？跟其他 app 共用資料？LINE？AI？）
不要每樣都抄，只抄你真的需要的部分。

---

## 0. 決定範圍（動手前先想清楚）

- 需不需要**登入**（Supabase Auth）？純瀏覽工具可能不用
- 需不需要跟其他 app **共用使用者**？（這個 monorepo 目前所有 app 共用同一個 Supabase 專案的
  `auth.users`，見下方「Supabase」章節）
- 需不需要 **LINE LIFF**（在 LINE App 裡開、LINE 帳號自動登入）？沒有明確需求就不要加，
  這是目前唯一一段比較重的整合，見 `apps/calorie-tracker/src/liff.js` 或
  `apps/recipe-book/src/liff.js` 的完整參考實作
- 需不需要**伺服器端密鑰**（AI API key、service_role key）？需要的話才要開 `api/` 資料夾
- 資料要不要分**擁有者／分享**（像 recipe-book 的 `user_id` + `is_shared`）？還是像
  calorie-tracker 一樣單純「每人只看自己的」？

---

## 1. 目錄結構

```
apps/<app-name>/
├── src/
│   ├── main.jsx           # 進入點：createRoot 掛 <Root/>；有 LIFF 才多一段 initLiff()
│   ├── Root.jsx           # 檢查 .env（用 supabaseReady）→ 檢查登入狀態 → 掛 <App/>
│   ├── App.jsx             # 主外殼：載入狀態 hook、分頁/畫面切換
│   ├── supabase.js         # re-export 共用 client，綁定這個 app 自己的 schema
│   ├── db.js                # Supabase 查詢的純函式，元件不直接 import supabase
│   ├── use<Domain>.js      # 狀態中樞 hook（見下方「狀態中樞」）
│   ├── utils.js             # 無副作用的純函式（格式化、篩選、parse）
│   ├── liff.js              # 只有需要 LINE 整合才加
│   └── components/
│       ├── Auth.jsx         # 只有需要登入才加（email/password，抄 recipe-book 的版本）
│       └── ...              # 其他畫面元件
├── api/                      # 只有需要伺服器端密鑰才加（Vercel serverless functions）
│   ├── _supabaseAdmin.js    # service_role client 工廠，db.schema 指向自己的 schema
│   └── <endpoint>.js         # 對外的 handler，內部呼叫 _xxx.js 的邏輯函式
├── supabase/
│   ├── schema.sql            # 第一版建表 SQL（一次跑完）
│   └── YYYY-MM-DD_*.sql      # 之後的增量 migration，檔名帶日期
├── index.html                # #root + <script src="/src/main.jsx">
├── vite.config.js
├── package.json
├── .env.example
├── README.md                  # 設定/開發/部署步驟（面向使用者）
└── ARCHITECTURE.md            # 檔案地圖 + 資料庫結構 + 設計重點（面向未來的自己/AI）
```

---

## 2. 註冊到 monorepo

1. **根目錄 `package.json`** 加兩行 script（`<name>` 換成新 app 資料夾名）：
   ```json
   "dev:<name>": "npm run dev -w <name>",
   "build:<name>": "npm run build -w <name>"
   ```
   （workspace 已經是 `apps/*` glob，不用額外註冊）

2. **`apps/<name>/package.json`**：
   ```json
   {
     "name": "<name>",
     "private": true,
     "type": "module",
     "scripts": { "dev": "vite", "build": "vite build", "preview": "vite preview" },
     "dependencies": {
       "@peggy-life/shared": "*",
       "@supabase/supabase-js": "^2.108.2",
       "react": "^19.2.7",
       "react-dom": "^19.2.7"
     },
     "devDependencies": {
       "@vitejs/plugin-react": "^6.0.3",
       "vite": "^8.1.0"
     }
   }
   ```
   有 LIFF 需求再加 `"@line/liff": "^2.29.0"`。

3. 根目錄跑一次 `npm install`。

---

## 3. Supabase：schema 隔離 + 共用 auth

**規則：每個 app 一個獨立 schema，`auth.users` 全部共用。**

1. 到同一個 Supabase 專案（不要另開新專案，除非你真的要完全獨立的資料庫）
2. `supabase/schema.sql` 開頭建 schema：
   ```sql
   create schema if not exists <app_schema>;
   grant usage on schema <app_schema> to anon, authenticated, service_role;
   ```
   建表都用 `<app_schema>.表名`，RLS + policy 照你的存取需求寫（唯讀公開／登入者專屬／
   擁有者+分享 三種模式參考現有兩個 app 的寫法）
3. Supabase Dashboard → **Integrations → Data API → Settings → Exposed schemas** 加入
   `<app_schema>`，Save，等 30 秒
4. **不要新建 schema 給「跨 app 共用資料」用**——這個專案曾經試過建 `shared` schema
   給 LINE 帳號對照表用，Supabase 這個專案的 Data API 一直無法把新 schema 正確 expose
   （Management API 確認設定對、重啟多次也沒用，判定是平台問題）。跨 app 共用資料目前
   的做法是**放進某個既有 app 的 schema**（例如都放 calorie_tracker），不要冒險開新 schema。
   如果之後要重試，先確認這個平台問題有沒有修好。

---

## 4. 前端 Supabase Client

**`apps/<name>/src/supabase.js`**：
```js
import { createAppSupabase, supabaseReady } from '@peggy-life/shared';

export const supabase = createAppSupabase({ schema: '<app_schema>' });
export { supabaseReady };
```
不要自己 `createClient(...)`，一律透過 `@peggy-life/shared` 的工廠函式，這樣 auth session
才會跟其他 app 共用同一套邏輯（`persistSession`/`autoRefreshToken` 已經在共用套件裡設好）。

---

## 5. 狀態中樞（state hub）模式

不要讓元件直接 import `db.js` 打 API。固定分層：

```
Supabase ⇄ db.js ⇄ use<Domain>.js ⇄ Root.jsx/App.jsx ⇄ components/*
          (純 API)   (狀態+動作)        (協調/路由)         (畫面)
```

- **`db.js`**：每個函式對應一個 DB 操作，純函式，不碰 React state
- **`use<Domain>.js`**：唯一的狀態中樞，回傳 `{ ...state, ...actions }` 給元件用；
  元件只透過這個 hook 的 return 值互動，不直接呼叫 `db.js`
- 樂觀更新（optimistic update）的模式：先更新本地 state，API 失敗就 rollback
  （參考 recipe-book `useRecipes.js` 的 `toggleLike`）

---

## 6. 樣式慣例

- 全部用 **inline style**，沒有用 CSS-in-JS 套件也沒有 Tailwind
- 樣式物件宣告在**檔案最外層（module scope）**，變數名一律叫 `S`，不要放在元件函式裡面
  （放函式裡每次 render 都會重新建立物件，是這個專案踩過的效能坑，見
  `RecipeDetail.jsx` 的 commit history）
- 互動元素（button）該有的都要加：
  - `outline: 'none'`（不然點擊後留下瀏覽器預設的黑色 focus 外框）
  - `cursor: 'pointer'`

---

## 7. 需要伺服器端密鑰時：`api/` 資料夾

Vercel serverless functions，本機用 `vite.config.js` 的 middleware 模擬（see
`apps/calorie-tracker/vite.config.js` 的 `groqDevApi()` 寫法，可以照樣複製一份改 endpoint）。

**`api/_supabaseAdmin.js`** 固定寫法：
```js
import { createClient } from '@supabase/supabase-js';

function adminClientForSchema(schema) {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('伺服器未設定 SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema },
  });
}

export function getSupabaseAdmin() {
  return adminClientForSchema('<app_schema>');
}
```
- **絕對不要**把 `SUPABASE_SERVICE_ROLE_KEY` 加 `VITE_` 前綴（會被打包進前端曝露出去）
- **絕對不要**在前端程式碼 import 這個檔案
- 每個 endpoint 拆兩個檔：`api/<name>.js`（Vercel handler，管 method + try/catch + 回 JSON）
  + `api/_<name>.js`（實際邏輯，純函式，方便本機直接 node 呼叫測試）

---

## 8. 需要 LLM（AI）功能時

- Prompt 只講輸出格式不夠準，一定要加 **3-5 個 few-shot 校準範例**，涵蓋不同情境
- 數值估算類任務把 `temperature` 設 0（不需要隨機性）
- 如果輸出會被使用者拿來判斷可信度，考慮讓 AI 附上估算依據（例如
  `【依據：品牌官方標示 / 類比同類產品 / 一般資料庫估算】`）
- 完整範例見 `apps/calorie-tracker/api/_groqFoodSearch.js`

---

## 9. 需要登入時

- 抄 `apps/recipe-book/src/components/Auth.jsx`：email/password 登入/註冊/忘記密碼
- 要不要開放**訪客瀏覽**（不登入也能看部分內容）？參考 recipe-book 的
  `Root.jsx` 的 `guest` state 設計
- 要不要跟其他 app 共用 LINE 登入？目前共用的 `line_links` 表放在 `calorie_tracker` schema
  （見上方第 3 節），新 app 要用的話直接讀寫那張表，不要重建一份

---

## 10. 部署到 Vercel

1. 新建一個 Vercel 專案，連到同一個 GitHub repo
2. **Settings → Root Directory** 設成 `apps/<name>`
3. **Settings → Environment Variables** 補上該 app 需要的變數（照 `.env.example` 抄，
   伺服器端密鑰不要加 `VITE_` 前綴）
4. **Settings → Git → Ignored Build Step** 填：
   ```bash
   git diff --quiet $VERCEL_GIT_PREVIOUS_SHA HEAD -- apps/<name> packages/shared
   ```
   避免改動其他 app 時誤觸發這個 app 重新部署（`$VERCEL_GIT_PREVIOUS_SHA` 比 Vercel UI
   內建的 `HEAD^` 選項更準，見根目錄 README 的說明）

---

## 11. 文件（每次改動都要跟著更新，不是選填）

- **`apps/<name>/README.md`**：面向「怎麼把它跑起來」——安裝、Supabase 設定順序（含每一支
  migration SQL 要跑的順序）、`.env` 怎麼填、開發指令、部署步驟
- **`apps/<name>/ARCHITECTURE.md`**：面向「怎麼改程式碼」——一句話總覽、資料流圖、
  「我要改 X 該開哪個檔」的檔案地圖表格、每個檔案在幹嘛、資料庫結構表格、
  migration 檔案清單（含跑的順序）、任何不直觀的設計決策都要寫「為什麼」
- 根目錄 **`README.md`** 的 Apps 清單、Supabase schema 表格也要跟著更新

---

## 12. 驗證改動

- 前端可觀察的改動（UI、互動）：`npm run build` 過 + 用 preview 工具啟動、實際操作截圖確認
- 純後端改動（`api/` 裡的邏輯、LLM prompt）：瀏覽器 preview 用不上，直接寫 node 腳本讀
  `.env` 的 key，呼叫該檔案 export 的函式打真實 API，肉眼比對輸出（範例見
  `apps/calorie-tracker/api/_groqFoodSearch.js` 的 commit history）。測試時要用
  **沒出現在 few-shot 範例裡的查詢**，才能確認是真的泛化不是死記硬背
- DB migration：寫完不會自動執行，一定要提醒使用者去 Supabase SQL Editor 手動跑，
  跑的順序要在 README 寫清楚

---

## 常見坑（別人已經踩過的）

- **`schema.sql` 不等於 DB 實際結構**：如果表是手動改過欄位（例如把某欄型別從 uuid
  改成 bigint、或改成陣列型別），`schema.sql` 檔案內容可能沒同步更新。改任何 payload
  邏輯前，先在 Supabase SQL Editor 跑
  `select column_name, data_type, udt_name from information_schema.columns where table_schema='...' and table_name='...'`
  確認真實欄位，不要照抄 `schema.sql` 文字
- **新 schema 建了要記得去 Dashboard expose**，不然前端會收到
  `relation does not exist` 或 `PGRST106 invalid schema`
- **不要在這個 Supabase 專案新開 schema 給跨 app 共用資料用**（見上方第 3 節），
  已知這個專案的 Data API 沒辦法正常 expose 新 schema
- **RLS policy 搬 schema 不會自動更新 policy body 裡寫死的 schema 前綴**——如果
  policy 裡有 `using (exists (select 1 from public.other_table ...))` 這種跨表
  reference，`alter table set schema` 之後要手動 `drop policy` + 重建，不然 policy
  引用的還是舊路徑
