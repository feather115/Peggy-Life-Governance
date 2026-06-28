# 飲食卡路里 App — 架構說明

> 給未來的自己（和 AI 助理）：要改某個東西時，先看這份表找到對應檔案，**不用讀整個專案**。

---

## 一句話總覽

Vite + React 單頁 App（顯示名稱「TY Calorie Tracker」），資料存在 Supabase（Postgres）。
畫面分四個分頁（今日 / 報表 / 挑戰 / 設定）＋ 五個彈出面板（食物庫 / JSON匯入 / 進階 / 新增挑戰 / 編輯餐點）。
**所有資料操作集中在 `useAppData.js`，所有畫面在 `components/`，所有數學在 `selectors.js`。**
還有一層 **`api/`**：Vercel serverless functions，給「AI 食物搜尋」「AI 當日摘要」「LINE 登入」用，金鑰只活在伺服器端，永遠不會打包進前端。
App 可以用 LIFF 連結包進 LINE 裡開（見下方「LINE 整合」），也可以單純當網頁用。

---

## 資料流（很重要，先懂這個）

```
Supabase ⇄ db.js ⇄ useAppData.js ⇄ App.jsx ⇄ components/*
           (純 API)  (狀態+動作)    (協調)    (畫面)
```

- 元件**不會**直接呼叫 `db.js`。元件拿到 `app`（= `useAppData()` 的回傳），呼叫上面的動作（如 `app.addMeal(...)`）。
- `useAppData` 負責：打 API（`db.js`）+ 更新前端 state，兩件事一起做。
- 純計算（總熱量、報表長條圖、月曆）放在 `selectors.js`，不碰 state、不碰 API。

---

## 檔案地圖 — 「我要改 X，該開哪個檔？」

| 你想改的東西 | 檔案 |
|---|---|
| **內建食物清單**（新增/改熱量） | `src/constants.js` → `FOODS` |
| **餐別**（早午晚點宵的名稱/圖示/emoji） | `src/constants.js` → `MEALS_DEF` |
| **卡路里環顏色 / 超標門檻** | `src/selectors.js` → `ringInfo()` |
| **報表：本週長條圖算法** | `src/selectors.js` → `buildWeek()` |
| **報表：月曆熱力圖 / 月統計 / 營養素比例** | `src/selectors.js` → `buildMonth()` |
| **報表：月份左右切換 / 點日期跳今日頁** | `src/components/ReportsTab.jsx` + `src/App.jsx` |
| **連續達標天數算法** | `src/selectors.js` → `computeStreak()` |
| **日期格式 / 問候語** | `src/utils.js` |
| **任何資料庫讀寫**（欄位、query） | `src/db.js` |
| **新增一種資料操作**（state + API） | `src/useAppData.js` |
| **今日頁畫面**（環、餐卡、營養條） | `src/components/TodayTab.jsx` |
| **報表頁畫面** | `src/components/ReportsTab.jsx` |
| **設定頁畫面**（目標、標籤管理、登出） | `src/components/SettingsTab.jsx` |
| **挑戰頁畫面**（排行榜、podium、登記、歷史、編輯名稱/結束日期） | `src/components/ChallengeTab.jsx` |
| **新增/加入挑戰彈窗** | `src/components/ChallengeCreateSheet.jsx` |
| **體重折線圖**（SVG） | `src/components/WeightChart.jsx` |
| **挑戰資料操作**（建立/加入/更新/結束/刪除/登記） | `src/db.js` + `src/useAppData.js` |
| **排行榜計算 / 剩餘天數** | `src/selectors.js` → `computeLeaderboard()`, `daysLeft()` |
| **食物庫面板 / 新增、編輯自訂食物表單**（含品牌、備註、AI搜尋、份數選擇） | `src/components/FoodSheet.jsx` |
| **編輯「今天已加入」的某筆餐點** | `src/components/EditMealItemSheet.jsx` |
| **今日頁的餐點顯示**（品牌、三大營養素、✏編輯按鈕） | `src/components/TodayTab.jsx` |
| **JSON 匯入面板**（也支援 brand/note 欄位） | `src/components/ImportSheet.jsx` |
| **進階面板**（斷食/原因標籤、AI摘要產生） | `src/components/AdvancedSheet.jsx` |
| **記錄原因標籤顏色 / 月曆彩色點** | `src/components/SettingsTab.jsx` + `src/components/ReportsTab.jsx` + `src/selectors.js` |
| **報表頁的飲食歷史搜尋 / 依餐別統計 / 複製進菜單** | `src/components/FoodHistoryCard.jsx` |
| **底部分頁列** | `src/components/TabBar.jsx` |
| **彈出面板的外框**（圓角、半透明背景、握把） | `src/components/Sheet.jsx` |
| **登入/註冊頁** | `src/components/Auth.jsx` |
| **登入判斷 / 設定缺失提示 / LINE 自動登入觸發點** | `src/Root.jsx` |
| **分頁切換 / 哪個面板開著 / App 外層高度（影響分頁列是否固定）** | `src/App.jsx` |
| **LIFF 初始化、LINE 自動登入、帳號連結** | `src/liff.js` |
| **設定頁「連結 LINE 帳號」按鈕** | `src/components/SettingsTab.jsx` → `LineLinker` |
| **AI 食物搜尋 / AI 當日摘要 / LINE 登入驗證的伺服器端邏輯** | `api/*.js`（見下方「AI 功能」「LINE 整合」） |
| **Supabase 連線金鑰 / AI / LINE 相關環境變數** | `.env`（複製 `.env.example`） |
| **資料庫建表 SQL（飲食 App 基本表）** | `supabase/schema.sql` |
| **資料庫建表 SQL（挑戰功能）** | `supabase/2026-06-25_weight_challenge.sql` |
| **挑戰排行榜算法 / 成員顏色分配** | `src/selectors.js` → `computeLeaderboard()`, `memberColor()` |
| **食物庫排序（最近用過排前面）** | `src/selectors.js` 無；邏輯在 `useAppData.js` 的 `touchFood()` + `FoodSheet.jsx` 排序 |
| **飲食歷史索引 / 依餐別排行算法** | `src/selectors.js` → `buildFoodHistory()`, `mealTypeBreakdown()` |

---

## 每個檔案在幹嘛

### 核心
- **`src/main.jsx`** — 進入點，只把 `<Root/>` 掛上去。幾乎不會改。
- **`src/Root.jsx`** — 看有沒有設定 `.env`、有沒有登入，決定顯示 `ConfigMissing` / `Auth` / `App`。
- **`src/App.jsx`** — 主外殼。載入 `useAppData`，管理 UI 狀態（目前分頁、選取日期、哪個面板開著），把分頁與面板組起來。
- **`src/useAppData.js`** — ⭐ **狀態中樞**。所有資料（days/foods/goals/tags）與改資料的動作都在這。元件透過它操作資料。
- **`src/db.js`** — Supabase 的純 CRUD 函式，一個動作一個 function。
- **`src/supabase.js`** — 建立 Supabase client；`supabaseReady` 判斷有沒有設定金鑰。

### 無狀態工具
- **`src/constants.js`** — 食物庫、餐別、星期。
- **`src/utils.js`** — 日期轉換、問候語、百分比、空白日結構。
- **`src/selectors.js`** — 把原始資料算成畫面數字（總熱量、報表、連續天數）。

### 畫面（`src/components/`）
- `TodayTab` / `ReportsTab` / `ChallengeTab` / `SettingsTab` — 四個分頁
- `FoodSheet` / `ImportSheet` / `AdvancedSheet` / `ChallengeCreateSheet` / `EditMealItemSheet` — 五個底部彈出面板
- `FoodHistoryCard` — 報表頁裡的飲食歷史卡片（搜尋/依餐別統計/編輯/複製進菜單）
- `WeightChart` — 挑戰用的多人折線圖（SVG）
- `TabBar` — 底部分頁列
- `Sheet` — 共用的彈出面板外框
- `Auth` — 登入 / 註冊 / 忘記密碼頁，LINE 自動登入失敗時會在最下面顯示除錯文字（`lineDebug` prop）

### LINE 整合 + AI 功能（`src/liff.js` + `api/`）
- **`src/liff.js`** — 初始化 LIFF（`initLiff()`）、在 LINE App 內自動登入（`lineAutoLogin()`）、把目前帳號連結到 LINE 身份（`linkLineAccount()` / `canLinkLine()`）。
- **`api/_groq.js`** — 呼叫 Groq Chat Completions 的最底層共用函式。
- **`api/food-search.js`** + `_groqFoodSearch.js` — AI 食物搜尋（FoodSheet 的「✨ AI 搜尋」）。
- **`api/day-summary.js`** + `_groqDaySummary.js` — AI 當日摘要（AdvancedSheet 的「✨ AI 幫我寫」），會把今天吃的東西、總營養素、目標值、當天標籤一起送給 AI。
- **`api/line-login.js`** + `_lineVerify.js` + `_lineLogin.js` — 驗證 LIFF 給的 LINE ID Token，自動建立/比對 Supabase 帳號，回傳一次性登入憑證。
- **`api/line-link.js`** + `_lineLink.js` — 把目前登入中的帳號跟 LINE 身份綁定，存進 `line_links` 表。
- **`api/_supabaseAdmin.js`** — 建立帶 `service_role` 金鑰的 Supabase admin client，只能在這些 `api/*.js` 裡用，**絕對不能被前端程式碼 import**。
- **`vite.config.js`** 裡的 `groqDevApi()` plugin — 本機開發時模擬 `/api/food-search` 與 `/api/day-summary` 兩個路由，讓 `npx vite` 也能測 AI 功能（讀本機 `.env` 的 `GROQ_API_KEY`）。LINE 登入因為依賴 `liff.isInClient()`（只有在真的 LINE App 裡才會是 true），本機沒辦法真正測，所以沒有對應的 dev 路由。

---

## 資料庫結構（Supabase）

完整 SQL 在 `supabase/schema.sql`。六張表：

| 表 | 用途 | 重點 |
|---|---|---|
| `user_settings` | 每人的卡路里/營養素目標 | 一人一列 |
| `tag_defs` | 標籤定義（斷食 / 記錄原因） | `type` 區分兩類；`color` 給記錄原因標籤在月曆上畫彩色點 |
| `custom_foods` | 使用者自訂食物 | `brand`/`note` 為選填欄位 |
| `day_records` | 每天一筆主記錄 | `(user_id, date)` 唯一 |
| `day_tags` | 當天啟用了哪些標籤（多對多） | 刪標籤定義會 CASCADE 自動清掉 |
| `meal_items` | 每筆吃下去的食物（**快照**） | 存當下的 name/cal/p/c/f，原食物刪了也不影響歷史 |
| `challenges` | 減重挑戰本體 | 含 invite_code (6 碼)、creator_user_id、status |
| `challenge_members` | 誰加入了哪場挑戰（多對多） | 用 RLS function `is_challenge_member` 控管成員可見性；`color` 欄位存成員自訂顏色 |
| `weight_entries` | 每週體重差值記錄 | `(challenge_id, user_id, week_label)` 唯一；同週再登記會 upsert |
| `food_usage` | 每個食物上次被選用/新增/編輯的時間 | `(user_id, food_ref)` 主鍵；`food_ref` 是內建食物的 id（如 `'egg'`）或 `custom_foods.id` |
| `line_links` | LINE 使用者 ↔ 既有帳號的對照 | 只有伺服器端（`service_role`）會碰，前端完全不能直接存取 |

**設計重點：**
- **快照式 `meal_items`** — 加入餐點時把食物的數值「複製一份」存起來，不是存外鍵。所以刪自訂食物、改目標都不會動到過去的記錄。
- **RLS（Row Level Security）** — 每張表都開，使用者只能存取自己的資料。
- **註冊 trigger** — 新使用者註冊時自動建好 `user_settings`（含 `email` 欄位備援名稱用）和預設標籤（168 / 輕斷食）。
- **挑戰用邀請碼分群** — 建挑戰時自動生 6 碼邀請碼（避開易混淆字元 0/O/1/I/L），分享給朋友才能加入；非成員看不到該挑戰任何資料。RLS 用 `SECURITY DEFINER` 的 helper function `is_challenge_member()` 避免 policy 遞迴。
- **邀請碼查詢繞過 RLS** — `find_challenge_by_code(p_code)` 也是 `SECURITY DEFINER` function。原因：`challenges` 的 select policy 只允許「建立者」或「已經是成員」讀取，所以還沒加入的人直接 `select ... where invite_code = ...` 會被 RLS 擋成空結果，誤判成「邀請碼不存在」。這個函式繞過限制，只回傳 `id`/`name` 給任何登入者查詢，加入流程（`db.js` 的 `joinChallengeByCode`）改用這個 RPC。
- **co-member 暱稱可見** — `user_settings` 多開一條 policy，讓「同一個挑戰成員之間」可以互相看到 `display_name` 與 `email`。
- **暱稱顯示後備** — 排行榜顯示名稱優先用 `display_name`，沒設就用 `email` 的 `@` 前綴（例如 `@feather115`），兩者都沒有才顯示「未命名」。邏輯在 `db.js` 的 `loadMyChallenges()` 裡的 `resolveName()`。
- **自訂食物的品牌/備註** — `custom_foods.brand`、`custom_foods.note` 都是選填欄位，純粹給使用者自己標記用（例如「全家」「去冰半糖」），不影響任何計算邏輯。因為 `meal_items` 是快照，**改自訂食物的品牌/備註/數值都不會動到已經記錄過的歷史餐點**——這點對話中問過好幾次，是這個 App 的核心設計原則，改任何 `custom_foods` 欄位都要記住這個前提。
- **`meal_items` 也有 `brand`** — 加入餐點時把當時食物的品牌也一起快照進去，今日頁才能顯示「名稱 · 品牌」。
- **食物庫排序用 `food_usage`，不是排序 `custom_foods`/`FOODS` 本身** — 選用/新增/編輯食物時都會 `upsert` 一筆 `food_usage`（`useAppData.js` 的 `touchFood()`），`FoodSheet.jsx` 顯示清單時依這張表的時間排序，最近用過的排最上面；宵夜餐別仍維持原本「依熱量低到高」排序，不套用這個邏輯。
- **記錄原因標籤顏色存在 `tag_defs.color`** — 主要給 `type='other'` 的標籤使用；設定頁可選顏色，報表月曆會把當天啟用的每個記錄原因標籤畫成對應顏色的小點。舊標籤沒有顏色時前端 fallback 為 `#E8A13C`。

---

## 食物快照與份數計算

- 在 `FoodSheet.jsx` 選擇食物時可以指定**份數**（支援小數，例如 `0.3`），卡路里與三大營養素會即時乘上份數再存進 `meal_items`；份量文字會變成 `"2 × 1 份"` 這種格式，方便回頭看是吃了幾份。份數輸入框本身可以直接打數字，不是只能用 +/− 一格一格調。
- `TodayTab.jsx` 每筆餐點下面會顯示 `蛋 X · 碳 Y · 脂 Z`，有品牌的話名稱旁邊也會帶出來。
- 已經加入的餐點可以直接編輯（`EditMealItemSheet.jsx`），只改這一筆，不會動到食物庫定義或其他天的歷史。

---

## 報表頁的月份月曆（`ReportsTab.jsx` + `selectors.js`）

- 月曆不是固定只看本月：`ReportsTab.jsx` 用 `monthCursor` 記住目前顯示的月份，左右箭頭會把月份往前/往後切。
- `selectors.js` 的 `buildMonth(days, goalCal, fastingIds, otherTagDefs, monthDate)` 會依傳入的 `monthDate` 計算該月份的月曆格、平均熱量、記錄天數、斷食/特殊標記天數、營養素比例，以及每天啟用的記錄原因標籤顏色。
- 每個非空日期格會帶 `dateKey`（`YYYY-MM-DD`）。點選非未來日期時，`ReportsTab.jsx` 呼叫 `onSelectDate(dateKey)`，由 `App.jsx` 設定 `selectedDate` 並切換到 `today` 分頁，因此會直接看到那一天的今日紀錄。
- 未來日期仍會顯示成灰色，但不能點；避免跳到未來日期新增/查看紀錄。

---

## 報表頁的飲食歷史（`FoodHistoryCard.jsx`）

- **搜尋食物**：輸入名稱（模糊比對，忽略大小寫），列出吃過幾次、最近一次日期；展開可以看到完整的歷史清單（哪天、哪一餐、多少卡路里），每筆都有：
  - **✏ 編輯**：直接改「那一天」那一筆的數值（呼叫 `app.editMeal`）。
  - **📋 複製進菜單**：把這筆歷史記錄存成一筆新的自訂食物（呼叫 `app.addCustomFood`），**不是**加進今天的餐點——因為原本那筆歷史記錄之後可能被刪掉，存進食物庫菜單才留得住。
- **依餐別統計**：選早/午/晚/點心/宵夜，列出這個餐別吃過的食物排行（依次數多到少），附帶平均卡路里，回答「我早餐通常吃什麼」。
- 這些統計全部是前端對已載入的 `days` 資料做運算（`selectors.js` 的 `buildFoodHistory()` / `mealTypeBreakdown()`），沒有額外打 API。

---

## LINE 整合細節

### 在 LINE 裡開、不跳出外部瀏覽器
靠 **LIFF（LINE Front-end Framework）**：在 LINE Developers Console 建一個 LIFF app，Endpoint URL 指向部署的網址，拿到一個 LIFF ID。之後在 LINE 裡分享 `https://liff.line.me/<LIFF_ID>` 這種格式的連結，LINE 認得自己的網域，會用內建瀏覽器直接開，不會丟給系統瀏覽器。`VITE_LIFF_ID` 設定了才會跑 `liff.init()`（`src/liff.js`），沒設定就完全跳過，當一般網頁用。

### 自動登入流程（`lineAutoLogin()`）
只有 `liff.isInClient()`（真的在 LINE App 裡開）才會觸發：
1. 前端用 `liff.getIDToken()` 拿到 LINE 簽過名的 ID Token（**LIFF app 的 Scope 要勾 `openid`**，不然這裡會是 `null`）。
2. POST 到 `/api/line-login`，伺服器端先用 LINE 的 `/oauth2/v2.1/verify` 驗證這個 token 真的是 LINE 發的（`LINE_CHANNEL_ID` 是 LINE Login channel 的 Channel ID，純數字、公開、不是密鑰）。
3. 驗證拿到 `payload.sub`（LINE 使用者唯一 ID）後，查 `line_links` 表看有沒有連結過既有帳號：
   - 有連結 → 用那個帳號的 email 產生登入連結。
   - 沒連結 → 用 `line-${sub}@line.invalid` 這個固定格式的信箱建一個新帳號（第一次見到這個 LINE 使用者）。
4. 用 Supabase admin 的 `generateLink({ type: 'magiclink' })` 產生一次性憑證（`hashed_token`），前端用 `supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })` 直接換成真正的 session——**全程不需要 email/密碼**。
5. 任何一步失敗都會把原因記在 `Root.jsx` 的 `lineDebug` state，顯示在登入頁最下面一行灰字，方便在沒有電腦除錯工具的情況下定位問題（例如 scope 沒開、channel 還沒發布等）。

### 帳號連結（`linkLineAccount()`，設定頁「🔗 連結 LINE 帳號」）
- 只有在 LINE App 裡、且已經用某個帳號登入時才會顯示這個按鈕（`canLinkLine()`）。
- 點了會把目前的 LINE 身份（`sub`）和目前登入的帳號 `user_id` 寫進 `line_links`（`api/line-link.js`，用呼叫者的 Supabase access token 驗證身份，不是隨便誰都能連結任意帳號）。
- 連結後，之後從 LINE 自動登入就會直接登入這個帳號，不會變成另一個新帳號。
- **如果在連結之前就已經用 LINE 自動登入過**，系統會先建立一個 `line-${sub}@line.invalid` 的帳號，之後再連結到別的帳號時，那個自動建立的帳號和它裡面的資料**不會自動合併**，會變成一個用不到的孤兒帳號——這是已知的限制，需要的話可以手動用 SQL 把舊帳號的資料搬過去，或直接忽略。

### LINE Login channel 的「Developing」狀態限制
- channel 預設是「Developing」（開發中），只有被加進這個 channel 的開發者名單的人才能用，其他人點 LIFF 連結會看到 `400 Bad Request: This channel is now developing status`。
- 要讓任何 LINE 使用者都能用，要把 channel **發布（Publish）**——LINE Login channel 沒有用到進階 Messaging API 功能的話，通常可以直接發布不需要審核。

### 環境變數（伺服器端，只能放 Vercel，絕對不能加 `VITE_` 前綴）
| 變數 | 從哪拿 | 敏感度 |
|---|---|---|
| `LINE_CHANNEL_ID` | LINE Login channel → Basic settings → Channel ID | 公開的數字，不是密鑰 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 專案 → Settings → API → service_role key | **極機密**，會繞過所有 RLS |
| `GROQ_API_KEY` | Groq 帳號的 API key | 機密，會被當成你的帳號額度使用 |

`VITE_LIFF_ID` 是唯一一個允許加 `VITE_` 前綴的（LIFF ID 本身設計上就是公開的）。

---

## 挑戰功能（Weight Challenge）細節

### 兩種角色
- **建立者**：可以改名稱、改結束日期、結束挑戰、刪除挑戰
- **一般成員**：可以登記體重、退出挑戰

> 「管理員」不是獨立角色 — 誰建立挑戰，誰就是該挑戰的建立者。一個人可以同時是 A 挑戰的建立者、B 挑戰的成員。

### 結束 vs 刪除
- **結束挑戰**：`status` 從 `active` 變 `ended`，自動標記冠軍。挑戰會從主畫面移到「🗂 歷史挑戰」摺疊區，**所有資料保留**。
- **刪除挑戰**：`ON DELETE CASCADE` 把成員、體重紀錄整批清掉，**無法復原**。

### 體重登記
- 體重欄填的是「從挑戰開始到現在的差值（公斤）」，減重用負數。
- `(challenge_id, user_id, week_label)` 是 UNIQUE — 同一天再登記會 upsert（覆蓋舊值）。
- 折線圖 X 軸是所有人實際登記過的日期（distinct），不是強制「每週一格」 — 但若大家都選週五，畫面就會自然每週一個點。
- **排行榜排序用 `week_label` 不是 `recordedAt`**——`week_label` 代表「哪一週」，`recordedAt` 是「寫入資料庫的時間」。如果用 SQL 一次性補登多筆歷史資料（例如幫朋友手動 insert 過去半年的紀錄），這些筆的 `recordedAt` 幾乎同一時間，用它排序會抓錯「最新一筆」。`selectors.js` 的 `computeLeaderboard()` 已修正為比較 `week_label` 字串大小。
- **輸入框有 `±` 切換鈕**——某些 Android 手機的數字鍵盤打不出負號，`ChallengeTab.jsx` 的 `EntryForm` 把輸入框換成 `inputMode="decimal"` 文字框，並在旁邊加一個按鈕直接反轉正負號，不用靠鍵盤打 `-`。
- **登記紀錄可編輯**——`EntryForm` 顯示「全部」歷史登記（不只最近幾筆），每筆旁邊有 ✏ 編輯按鈕：點了會把數值帶回表單、鎖住日期欄位（避免改日期變成新增一筆），送出後會 upsert 覆蓋原本那筆。

### 邀請碼
- 建立挑戰時自動生 6 碼。若撞名最多重試 5 次（unique violation `23505`）。
- 加入時不分大小寫（前端會 toUpperCase）。
- 已加入又輸入同一碼不會錯誤（PK violation 被吃掉）。
- 查詢邀請碼走 `find_challenge_by_code()` RPC（見上方「邀請碼查詢繞過 RLS」），不能改回直接 `select`，否則非成員又會查不到。

### 折線圖與顏色（`WeightChart.jsx` + `selectors.js`）
- 多人疊在一起時用 bezier 曲線連點（`smooth()`，現為 `linePath()`），但**不畫面積填色**——人多時透明面積疊加會糊成一片「陰影」，只有「單獨高亮一條線」時才畫面積。
- 點的半徑縮小（3.5px 一般 / 2.5px 被淡化時），去掉了原本的外圈光暈，手機上看起來比較乾淨。
- 點圖例任一人名可單獨高亮那條線、其他人淡化到 0.18 透明度（`highlightUserId` 狀態存在 `ChallengeTab.jsx` 的 `ProgressChartCard`）。
- X 軸標籤太多週數時只挑約 8 個顯示（含最後一週），避免擠成一團。
- **顏色分配**：`selectors.js` 的 `memberColor(challenge, userId)` 優先用 `challenge_members.color`（使用者自訂），沒設就依「加入挑戰的時間順序」從 16 色色盤（`MEMBER_PALETTE`）固定分配 index，保證同一挑戰內每個人顏色都不同（不是用 userId 雜湊，雜湊在人少色盤小時容易撞色）。
- **自訂顏色 UI**：圖表下方圖例，自己的名字旁邊有 🎨 按鈕，點開 `ColorPicker` 選色盤裡的顏色，存到 `challenge_members.color`（透過 `db.js` 的 `setMemberColor()`），只影響自己這個挑戰裡的顯示顏色。

### 想清掉所有歷史挑戰
Supabase SQL Editor 跑這行：
```sql
delete from public.challenges where status = 'ended';
```
CASCADE 會把對應的成員關聯與體重紀錄一併清掉。`active` 的挑戰不受影響。

---

## Migration 檔案清單（`supabase/`）

`schema.sql` 是飲食 App 的基本表（一次跑完）；挑戰功能與後續調整都是獨立的增量 migration，**要照順序跑過一次**，之後新環境部署可以直接看這份清單照順序執行：

| 檔案 | 做什麼 |
|---|---|
| `schema.sql` | 飲食 App 6 張基本表 + RLS + 註冊 trigger（已內含最新的 168/輕斷食預設標籤） |
| `2026-06-25_weight_challenge.sql` | 挑戰功能 3 張表（`challenges`/`challenge_members`/`weight_entries`）+ RLS + `is_challenge_member()` + `find_challenge_by_code()`（已併入最新版本） |
| `2026-06-25_user_settings_email.sql` | 幫 `user_settings` 加 `email` 欄位＋回填現有使用者，註冊 trigger 順便存 email（舊版預設標籤已被下面這支取代） |
| `2026-06-25_default_fasting_tags.sql` | 把新使用者預設斷食標籤精簡成「168 / 輕斷食」（不影響現有使用者） |
| `2026-06-26_member_color.sql` | 幫 `challenge_members` 加 `color` 欄位 + 讓成員能 update 自己那一列的顏色 |
| `2026-06-26_join_by_code_fix.sql` | 補 `find_challenge_by_code()`（如果環境是在這支之前就建好 `2026-06-25_weight_challenge.sql`，需要另外跑這支） |
| `2026-06-26_custom_food_brand_note.sql` | 幫 `custom_foods` 加 `brand`、`note` 兩個選填欄位（已併入最新版 `schema.sql`） |
| `2026-06-26_meal_item_brand.sql` | 幫 `meal_items` 加 `brand` 欄位（已併入最新版 `schema.sql`） |
| `2026-06-26_line_links.sql` | 建立 `line_links` 對照表（LINE 帳號連結用），開 RLS 但不開 policy（只給伺服器端 `service_role` 用） |
| `2026-06-28_food_usage.sql` | 建立 `food_usage` 表（食物庫排序用），已併入最新版 `schema.sql` |
| `2026-06-28_tag_def_colors.sql` | 幫 `tag_defs` 加 `color` 欄位，讓記錄原因標籤可自訂顏色並顯示在報表月曆 |

> 全新環境直接照順序整段貼上跑一次即可；如果是延續舊環境，只需要補跑「還沒跑過」的那幾支（看 Supabase 有沒有對應欄位/function 判斷）。
>
> 注意：`line_links`、`food_usage`、`tag_defs.color` 都不在 `2026-06-25_weight_challenge.sql` 之類的早期 migration 裡，是後來才加的，舊環境一定要記得補跑。

---

## `useAppData` 提供的動作（給元件用）

| 動作 | 做什麼 |
|---|---|
| `setGoalCal/P/C/F(n)` | 改目標（自動 debounce 存回） |
| `addMeal(date, mealKey, snapshot)` | 加一筆餐點 |
| `removeMeal(date, mealKey, itemId)` | 刪一筆餐點 |
| `addCustomFood(food)` | 新增自訂食物，回傳新食物 |
| `removeCustomFood(id)` | 刪自訂食物 |
| `updateCustomFood(id, food)` | 改自訂食物定義（名稱/品牌/份量/卡路里/營養素/備註），不影響歷史記錄 |
| `editMeal(date, mealKey, itemId, patch)` | 編輯已加入的某筆餐點（名稱/品牌/份量/卡路里/營養素），只改那一筆 |
| `importFoods(list)` | 批次匯入，回傳成功筆數 |
| `toggleTag(date, tagId, makeActive)` | 某天開/關一個標籤 |
| `saveDayNote(date, note)` | 存當日 AI 摘要 |
| `addTagDef(type, label)` | 新增標籤定義 |
| `updateTagColor(type, id, color)` | 更新標籤顏色（目前 UI 主要用在記錄原因標籤） |
| `deleteTagDef(type, id)` | 刪標籤定義（含清前端殘留） |
| `clearAll()` | 清除全部日記錄與自訂食物 |
| `createChallenge({ name, startDate, endDate })` | 建挑戰，產生邀請碼，自己自動成員 |
| `joinChallenge(code)` | 用邀請碼加入挑戰 |
| `leaveChallenge(id)` | 退出挑戰（自己的紀錄會被刪） |
| `updateChallenge(id, patch)` | 改 `name` / `startDate` / `endDate`（RLS 限建立者） |
| `endChallenge(id, winnerUserId)` | 結束挑戰並記錄冠軍 |
| `deleteChallenge(id)` | 整場刪除（CASCADE 清掉成員與紀錄） |
| `submitWeightEntry({ challengeId, kgDiff, weekLabel })` | 登記/更新某週體重差值 |
| `removeWeightEntry(entryId)` | 刪除一筆體重紀錄 |
| `setMemberColor(challengeId, colorHex)` | 改自己在這個挑戰裡的顯示顏色（`colorHex` 傳 `null` 恢復預設） |

> 還有一個內部用的 `touchFood(foodRef)`（非直接匯出給元件呼叫，`addMeal`/`addCustomFood`/`updateCustomFood` 內部會自動觸發）：記錄某個食物剛被選用/新增/編輯，更新 `food_usage`，讓食物庫排序即時反映。

---

## 怎麼跑起來

```bash
npm install            # 第一次
npx vite               # 開發（http://localhost:3456）
npx vite build         # 打包到 dist/
npx vite preview       # 預覽打包結果
```

需要先建立 `.env`（見 README 或 `.env.example`）。基本功能只要 `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`；AI 功能要 `GROQ_API_KEY`；LINE 登入要 `VITE_LIFF_ID`/`LINE_CHANNEL_ID`/`SUPABASE_SERVICE_ROLE_KEY`（見上方「LINE 整合細節」）。沒設定的功能會自動跳過，不影響其他部分。

---

## 手機版面的兩個坑（已修好，記錄原因避免改回去）

- **底部分頁列一進去就看不到，要滑到底才會固定**：原因是外層容器用 `minHeight: 100vh`，手機瀏覽器網址列還沒收起來時，可視高度比 `100vh` 矮，分頁列被擠到畫面外。`App.jsx` 改成 `height: 100vh` + `maxHeight: 100dvh`（動態視窗高度，會即時反映網址列收起/展開的實際可視範圍）+ `overflow: hidden`，只有中間內容區域會滾動，分頁列永遠固定在最下面。
- **手機鍵盤打不出負號**：某些 Android 鍵盤的數字輸入模式沒有負號鍵。挑戰功能的體重輸入框（`ChallengeTab.jsx`）、自訂食物的卡路里/營養素輸入都改成文字框 + 額外的 `±` 切換按鈕，不依賴鍵盤本身能不能打負號。
