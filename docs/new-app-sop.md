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
- 需不需要 **LINE LIFF**（在 LINE App 裡開、LINE 帳號自動登入 + 帳號連結）？沒有明確需求
  就不要加，這是目前最重的一段整合，三個現有 app 都已經照同一套模式做好，直接抄，
  完整流程見下方**第 9 節「LINE 整合」**，不要自己重新設計
- 需不需要**暱稱**顯示（例如「誰按讚」「排行榜」這種要秀出「這是誰」的功能）？
  暱稱是三個 app **共用**的一份資料（`shared.user_profiles`），不要在自己 app 的 schema
  裡另開一份，見第 9 節「暱稱跨 app 共用」
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
│   ├── liff.js              # 只有需要 LINE 整合才加：@peggy-life/shared/lineAuth 的薄殼（見第 9 節）
│   └── components/
│       ├── Auth.jsx         # 只有需要登入才加（email/password，抄 recipe-book 的版本）
│       ├── Settings.jsx / SettingsTab.jsx  # 帳號資訊：email、暱稱、LINE 連結、登出
│       │                                    （見第 9 節「Settings 頁面模式」）
│       └── ...              # 其他畫面元件
├── api/                      # 只有需要伺服器端密鑰才加（Vercel serverless functions）
│   ├── _supabaseAdmin.js    # service_role client 工廠：getSupabaseAdmin()（自己 app 的
│   │                          schema）+ getSupabaseAdminForLine()（指向共用的 shared schema）
│   ├── _lineVerify.js / _lineLogin.js / line-login.js       # LINE LIFF 自動登入
│   ├── _lineLink.js / line-link.js                           # 綁定 LINE 帳號
│   ├── _lineLinkStatus.js / line-link-status.js              # 查詢是否已綁定
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
4. 如果加完之後打 API 還是回 `PGRST106 Invalid schema`：**這是 Supabase 官方公開的已知
   bug，不是你設定錯，也跟免費/付費方案無關**。Dashboard 的 Exposed schemas 改的是一層，
   PostgREST 實際讀的是 Postgres `authenticator` 角色的 `pgrst.db_schemas` 設定，兩者有時候
   不同步，光靠 Dashboard 存檔、Restart project、甚至 Management API PATCH `db_schema` 都
   可能沒用。**正確修法**是直接在 SQL Editor 對 Postgres 角色下手：
   ```sql
   ALTER ROLE authenticator SET pgrst.db_schemas = 'public, calorie_tracker, recipe_book, <app_schema>, graphql_public';
   NOTIFY pgrst, 'reload config';
   ```
   （schema 清單要包含所有現有 app 的 schema，不是只放新的這個，不然會把其他 app 擠掉）
   跑完立刻生效，不用等待。參考：
   [Supabase 官方文件 PGRST106](https://supabase.com/docs/guides/troubleshooting/pgrst106-the-schema-must-be-one-of-the-following-error-when-querying-an-exposed-schema)。
   Debug 時可以直接 curl REST API 繞過瀏覽器/CDN cache 確認 PostgREST 真正的狀態：
   ```bash
   curl -s "https://<project-ref>.supabase.co/rest/v1/<table>?select=*&limit=1" \
     -H "apikey: <anon key>" -H "Accept-Profile: <app_schema>"
   ```
5. 新建 schema 給「跨 app 共用資料」用本身是可行的（上面這個修法出來之前，這份 SOP 曾經
   建議「不要冒險開新 schema」，那是繞開問題的暫時措施，不是正確答案）——只是要記得，
   新 schema 第一次 expose 時大機率會撞到這個 bug，遇到了直接跑上面的 `ALTER ROLE`，
   不用浪費時間在 Dashboard 反覆重新勾選。

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

## 9. 登入、LINE 整合、暱稱（三個現有 app 共用的一整套框架）

這一節是三個現有 app（calorie-tracker、recipe-book、calendar）目前**完全一致**的實作，
新 app 要做登入/LINE/暱稱，直接照抄這裡的模式，不要自己重新設計。

> **同步規則**：`api/` 底下的 `_lineVerify.js`、`_lineLogin.js`、`_lineLink.js`、
> `_lineLinkStatus.js`、`line-login.js`、`line-link.js`、`line-link-status.js` 在三個
> 現有 app 之間**逐字相同**（Vercel serverless 只能每個 app 各放一份實體檔案，沒辦法
> import monorepo 其他 package）。改任何一份就要 `cp` 同步到其他 app。唯一允許不同的
> 是 `_supabaseAdmin.js` 裡 `getSupabaseAdmin()` 指向的 schema 名稱。
> 前端的 `src/liff.js` 則沒有這個問題——邏輯集中在 `packages/shared/src/lineAuth.js`，
> 各 app 只放 14 行薄殼。

### 9.1 Email/密碼登入

抄 `apps/recipe-book/src/components/Auth.jsx`：email/password 登入/註冊/忘記密碼。
要不要開放**訪客瀏覽**（不登入也能看部分內容）？參考 recipe-book 的 `Root.jsx` 的
`guest` state 設計。

### 9.2 LINE LIFF 自動登入

讓使用者從 LINE App 裡打開連結（`https://liff.line.me/<LIFF_ID>`）時不用輸入帳密，
直接用 LINE 身份登入。三個檔案一組：

- **`src/liff.js`** — 不要自己寫！LINE 前端邏輯只有一份，在
  `packages/shared/src/lineAuth.js` 的 `createLineAuth(supabase)`，新 app 的 liff.js
  只是薄殼（照抄任一現有 app 的 `src/liff.js`，14 行）。factory 提供：
  - `initLiff()` — app 啟動時呼叫一次 `liff.init({ liffId })`（`VITE_LIFF_ID` 沒設就
    直接 return，整段功能靜默跳過，不影響一般網頁使用）
  - `lineAutoLogin()` — 只有 `liff.isInClient() && liff.isLoggedIn()` 才會嘗試：
    `liff.getIDToken()` 拿 ID token → POST `/api/line-login` → 用回傳的 `tokenHash`
    呼叫 `supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })` 換成真正的
    session。回傳 `{ ok, reason }`，`reason` 是給除錯用的診斷字串，失敗时**不要**
    直接吞掉，要能在 `Auth.jsx` 顯示出來（見 `lineDebug` prop 的用法）。
- **`api/_lineVerify.js`** — `verifyLineIdToken(idToken, channelId)`：呼叫 LINE 官方
  `https://api.line.me/oauth2/v2.1/verify` 驗證 token 真偽，`client_id` 參數要傳
  **`LINE_CHANNEL_ID`**（純數字的 Channel ID，不是 LIFF ID——這兩個長得很像但不一樣，
  是這個功能最常踩的坑，見下方「常見坑」）
- **`api/_lineLogin.js` + `api/line-login.js`** — 驗證通過後，用 LINE 的 `sub`
  （使用者唯一 ID）產生一個穩定、不會跟真實 email 撞名的假 email
  `line-<sub>@line.invalid`；先查 `shared.line_links` 有沒有既有帳號連結過這個
  LINE 身份，有的話登入那個帳號，沒有就用 `admin.auth.admin.createUser()` 建一個
  新帳號；最後 `admin.auth.admin.generateLink({ type: 'magiclink', email })` 產生
  一次性登入連結，把 `hashed_token` 回傳給前端

### 9.3 LINE 帳號連結（把既有帳號綁定到 LINE 身份）

跟自動登入是分開的功能：使用者先用 email 登入現有帳號，再「連結 LINE」，之後從
LINE 開啟就會直接登入**這個**帳號，而不是自動登入產生的新帳號。

- **`src/liff.js`** 再加三個函式：
  - `canLinkLine()` — `!!VITE_LIFF_ID && liff.isInClient() && liff.isLoggedIn()`，
    只有在 LINE App 裡打開才 true，一般瀏覽器打開看不到「連結」按鈕
  - `linkLineAccount()` — 帶著目前登入的 `accessToken` + LINE `idToken` 一起
    POST `/api/line-link`
  - `checkLineLinked()` — 查詢目前帳號是否已經連結過，任何瀏覽器都能查（純讀
    `shared.line_links` 的一列，不需要在 LINE App 裡開），沒有 session 或查詢失敗
    回傳 `null`（代表「不確定」，不要誤判成「沒連結」，見下面 UI 的快取邏輯）
- **`api/_lineLink.js` + `api/line-link.js`** — 驗證 `idToken` + `accessToken` 都
  有效後，把 `(line_sub, user_id)` upsert 進 `shared.line_links`
- **`api/_lineLinkStatus.js` + `api/line-link-status.js`** — 給 `checkLineLinked()`
  打的端點，查 `shared.line_links` 裡有沒有這個 `user_id` 的列

### 9.4 Settings 頁面模式

三個 app 的設定頁長得幾乎一樣，新 app 直接照這個結構做：

- **帳號卡片**：顯示目前登入 email；LINE 登入產生的假 email
  （`line-<sub>@line.invalid`）要遮罩成 `LINE: U1234...wxyz`，不要讓使用者看到原始假 email
  ```js
  const displayEmail = (() => {
    const email = session?.user?.email || '';
    if (email.endsWith('@line.invalid')) {
      const match = email.match(/^line-(U[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{4})@line\.invalid$/);
      return match ? `LINE: ${match[1]}...${match[2]}` : 'LINE 登入帳號';
    }
    return email;
  })();
  ```
- **`NicknameEditor`**（內部元件）：輸入框 + 儲存按鈕，讀寫 `shared.user_profiles`（見
  9.5）。存的值只有跟上次載入不同才能按儲存，避免手滑重複打 API。
- **`LineLinker`**（內部元件）：
  - `linked === true` → 顯示「✅ 已連結 LINE 帳號」
  - `linked === null`（還沒查完/查失敗）且 `!canLinkLine()` → 什麼都不顯示
  - `!linked && canLinkLine()` → 顯示「🔗 連結 LINE 帳號」按鈕
  - **連結狀態要快取到 `localStorage`**（key 例如 `<app>:line-linked`）：`checkLineLinked()`
    查到 `true` 才寫入快取，重開 app 先用快取顯示「已連結」，避免查詢還沒回來、或
    暫時網路失敗時畫面閃一下「未連結」又跳回「已連結」
- **登出按鈕**

### 9.5 暱稱跨 app 共用（`shared.user_profiles`）

暱稱不是每個 app 自己的資料，是三個 app **共用同一份**——在任一個 app 的設定頁改
暱稱，其他 app 立刻看到同一個名字。這是繼 `shared.line_links` 之後第二個放在共用
`shared` schema 的表。

- **表定義**：`shared.user_profiles(user_id uuid PK, display_name text, email text,
  created_at)`，migration 在 `packages/shared/supabase/2026-07-06_shared_user_profiles.sql`
- **RLS**：`auth.uid() = user_id` 才能 insert/update；**select 對所有登入使用者開放**
  （`to authenticated using (true)`）——暱稱不是敏感資料，而且「誰按讚」「排行榜」這類
  功能本來就需要看到別人的暱稱，比某些 app 舊版「只有同一組成員互相看得到」的政策更寬，
  但風險可以接受
- **前端讀寫**：不要另外開一個 `createAppSupabase({ schema: 'shared' })` client
  （會變成兩個各自 `persistSession` 的 GoTrue 實例，搶同一把 storage key，跳出
  「Multiple GoTrueClient instances」警告）。用同一個 `supabase` client 的
  `.schema('shared')` 方法切換查詢目標就好：
  ```js
  await supabase.schema('shared').from('user_profiles')
    .select('display_name').eq('user_id', userId).maybeSingle();
  ```
- **新使用者的種子列**：由 `packages/shared/supabase/2026-07-06_shared_user_profiles.sql`
  裡的 `public.handle_new_user_shared_profile()` + `on_auth_user_created_shared_profile`
  trigger 負責，新 app **不需要**自己再處理這件事（這個 trigger 已經涵蓋所有
  `auth.users`，不分哪個 app 建立的帳號）

### 9.6 新使用者註冊 trigger 命名慣例（絕對不能同名）

`auth.users` 上可以同時掛好幾個 `AFTER INSERT` trigger，各自負責幫自己的 app
建初始資料（`user_settings`、預設分類、`shared.user_profiles` 種子列……）。**但
trigger 名稱和 function 名稱都必須跨 app 唯一**：

- calorie-tracker：`on_auth_user_created` / `public.handle_new_user()`
- recipe-book：`on_auth_user_created_recipe_book` / `public.handle_new_user_recipe_book()`
- shared（三個 app 共用的暱稱表）：`on_auth_user_created_shared_profile` /
  `public.handle_new_user_shared_profile()`

新 app 如果需要註冊 trigger，取一個帶自己 app 名稱的獨一無二名字，例如
`on_auth_user_created_<app>` / `public.handle_new_user_<app>()`。**絕對不要**沿用
`on_auth_user_created` 這種通用名字——`create trigger` 沒有 `if not exists`，
`drop trigger if exists` + `create trigger` 這組寫法一旦跟別的 app 同名，會直接
覆蓋掉對方的 trigger，讓那個 app 的新使用者初始化邏輯整個消失，而且不會有任何
錯誤訊息提示你做錯了什麼。

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
- **Dashboard expose 之後還是 `PGRST106`？跑 `ALTER ROLE authenticator SET pgrst.db_schemas = '...'`
  + `NOTIFY pgrst, 'reload config'`**（見上方第 3 節第 4 點）——這是 Supabase 官方已知 bug，
  Dashboard／Management API 改的設定不保證會同步到 PostgREST 實際讀的 Postgres 角色設定，
  不要在 Dashboard 反覆重新勾選或一直 Restart project 硬試，浪費時間
- **RLS policy 搬 schema 不會自動更新 policy body 裡寫死的 schema 前綴**——如果
  policy 裡有 `using (exists (select 1 from public.other_table ...))` 這種跨表
  reference，`alter table set schema` 之後要手動 `drop policy` + 重建，不然 policy
  引用的還是舊路徑
- **`LINE_CHANNEL_ID` 不是 LIFF ID**——LIFF ID 長得像 `2010602685-0b2EBzrP`，前面那段
  數字 `2010602685` 才是 LINE Login channel 的 Channel ID，`-0b2EBzrP` 是 LIFF app
  自己的後綴。`api/_lineVerify.js` 打 LINE 的 `/oauth2/v2.1/verify` 時 `client_id`
  參數要傳純數字的 Channel ID。傳錯的症狀是 LINE 回 400 + `"some parameters in the
  wrong format"`；`_lineVerify.js` 已經內建把 token 的 `aud`（LINE 預期的 client_id）
  跟實際送出去的 `client_id` 一起印在錯誤訊息裡，兩個對不上就是這個坑
- **`/api/line-login` 回 `User not allowed`**——這是 Supabase GoTrue Admin API 在
  金鑰權限不足時的標準錯誤，通常代表 `SUPABASE_SERVICE_ROLE_KEY` 這個環境變數的值不對
  （最常見是誤貼成 `anon` key，或貼到別的 Vercel 專案的環境變數裡），去 Supabase
  **Settings → API** 核對 `service_role` secret 是不是真的填對了，跟程式邏輯、
  LINE token 驗證都無關
- **`step` 屬性對 `<input type="time">`/`<input type="datetime-local">` 的 UI 不生效**——
  多數瀏覽器點原生時間選擇器的上下鍵還是以 1 分鐘為單位滾動，不會照 `step` 設的秒數
  跳。想要「預設 30 分鐘一格」的體驗，要自己做一個 `<select>` 下拉選單（見
  `apps/calendar/src/components/TimeSelect.jsx`），不要指望 `step` 屬性
