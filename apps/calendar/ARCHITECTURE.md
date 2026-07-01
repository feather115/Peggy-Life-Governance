# TY Calendar — 架構說明

> 給未來的自己（和 AI 助理）：要改某個東西時，先看這份表找到對應檔案，**不用讀整個專案**。

---

## 一句話總覽

Vite + React 19 單頁 App，純個人行程管理：月/週/日三種檢視 + 新增/編輯/刪除事件。
資料存在 Supabase 的 `calendar.events` 表，每人只能看/改自己的事件（沒有分享機制）。
需要登入才能使用，跟 calorie-tracker、recipe-book 共用同一個 Supabase 專案的 `auth.users`，
可以用 LIFF 連結在 LINE App 裡直接開啟並自動登入。

---

## 資料流

```
Supabase ⇄ db.js ⇄ useEvents.js ⇄ Root.jsx / App.jsx ⇄ components/*
          (純 API)  (狀態+動作)      (登入閘口 / 協調)     (畫面)
```

- 元件**不會**直接呼叫 `db.js`。`useEvents()` 一次提供事件資料、月/週/日檢視狀態、
  和新增/編輯/刪除的 action。
- `Root.jsx` 負責：`.env` 檢查、LINE 自動登入、Email/密碼登入閘口。
- `App.jsx` 負責 520px 置中外殼，依 `editing` state 切換「檢視畫面」或「事件表單」。

---

## 檔案地圖 — 「我要改 X，該開哪個檔？」

| 你想改的東西 | 檔案 |
|---|---|
| **月檢視（格線月曆、事件小圓點）** | `src/components/MonthView.jsx` |
| **週檢視（7 天直向列表）** | `src/components/WeekView.jsx` |
| **日檢視（單日事件列表、新增按鈕）** | `src/components/DayView.jsx` |
| **月/週/日切換 tab、回到今天** | `src/components/ViewTabs.jsx` |
| **新增/編輯事件表單（標題、全天開關、時間、備註、刪除）** | `src/components/EventForm.jsx` |
| **日期運算（月曆格線、週的 7 天、時間格式化、事件分組）** | `src/utils.js` |
| **Supabase 查詢（events 的 CRUD）** | `src/db.js` |
| **Supabase client 連線** | `src/supabase.js`（re-export `@peggy-life/shared`） |
| **LINE LIFF 初始化與登入** | `src/liff.js` |
| **Email/密碼與 LINE 自動登入閘口** | `src/Root.jsx` |
| **Email 登入/註冊/重設密碼頁面** | `src/components/Auth.jsx` |
| **狀態中樞（事件清單、檢視模式、新增/編輯/刪除）** | `src/useEvents.js` |
| **主外殼、editing state（切換檢視畫面或表單）** | `src/App.jsx` |

---

## 每個檔案在幹嘛

### 核心
- **`src/main.jsx`** — 進入點，呼叫 `initLiff()` 完成後掛載 `<Root/>`。
- **`src/Root.jsx`** — 檢查 `.env` → 執行 LINE 自動登入 / Email 登入驗證 → 已登入則載入 `<App/>`。
- **`src/App.jsx`** — 520px 置中外殼，載入 `useEvents()`，依 `editing` state 切換
  「月/週/日檢視」或「新增/編輯表單」。
- **`src/useEvents.js`** — ⭐ **狀態中樞**。載入事件、`eventsByDate`（依日期分組）、
  月/週/日檢視狀態（`view` + `anchorKey`）、新增/編輯/刪除 action。
- **`src/db.js`** — Supabase 的純查詢函式（`loadEvents`/`createEvent`/`updateEvent`/`deleteEvent`）。
- **`src/supabase.js`** — re-export `@peggy-life/shared` 的 supabase client（`schema: 'calendar'`）。
- **`src/liff.js`** — LINE LIFF 初始化、LINE 自動登入及帳號綁定（跟其他 app 共用同一套邏輯）。

### 無狀態工具
- **`src/utils.js`** — 日期字串轉換（`dateKeyFrom`/`parseDateKey`）、月曆格線
  （`getMonthDays`）、週的 7 天（`getWeekDays`）、事件依日期分組（`groupEventsByDate`）、
  `<input type="datetime-local">` 字串轉換（`toDatetimeLocalValue`/`fromDatetimeLocalValue`）。

### 畫面（`src/components/`）
- **`ViewTabs.jsx`** — 月/週/日三個 tab + 「今天」按鈕。
- **`MonthView.jsx`** — 格線月曆，有事件的日期顯示小圓點，點日期跳去日檢視
  （`onSelectDay`）。
- **`WeekView.jsx`** — 一週 7 天直向列表，每天列出當天事件（時間 + 標題），
  點某一天跳去日檢視。
- **`DayView.jsx`** — 單日事件列表（時間 + 標題 + 備註），可切換前一天/後一天，
  點事件進編輯，底部有「＋ 新增事件」按鈕（新增動作只從這裡發起，月/週檢視只負責導覽）。
- **`EventForm.jsx`** — 新增/編輯事件表單：標題、全天事件開關（切換 `date`/`datetime-local`
  輸入框）、開始/結束時間、備註、刪除（兩段確認）。
- **`Auth.jsx`** — 登入介面：Email + 密碼登入、註冊、忘記密碼，跟其他 app 風格一致。

---

## 為什麼「新增事件」只能從日檢視發起

月檢視、週檢視都只負責「導覽」（點日期 → 跳到日檢視），不各自帶一個「新增」按鈕。
原因：月/週檢視一次顯示多天，如果每個檢視都各自提供快速新增，容易搞不清楚「新增的事件
會落在哪一天」。統一從日檢視新增，日期永遠是畫面上明確顯示的那一天，不會誤植日期。

---

## Schema 隔離 + 跨 app 共用 LINE 登入

| Schema | 屬於哪個 app | 內容 |
|---|---|---|
| `calendar` | calendar（本 app） | `events` 表 |
| `calorie_tracker` | calorie-tracker | 11 張表（`user_settings`、`day_records`、`challenges` …） |
| `recipe_book` | recipe-book | `recipes` / `recipe_likes` / `cooking_history` |
| `shared` | 三個 app 共用 | `line_links`（LINE 身份對照表，本 app 也讀寫這張） |
| `auth` | 三個 app 共用 | Supabase 內建的使用者表 |

**LINE 登入為什麼要讀寫 `shared` schema，不是自己的 `calendar` schema？**
`line_links`（LINE 身份 ↔ Supabase 帳號對照）是跨 app 共用的資料，放獨立的 `shared` schema，
本 app 的 `api/_supabaseAdmin.js` 提供 `getSupabaseAdminForLine()` 指向那裡。這個 schema
第一次 expose 時卡過 `PGRST106`（Supabase 平台已知 bug：Dashboard 的 Exposed schemas 設定
跟 PostgREST 實際讀的 Postgres `authenticator` 角色設定會不同步），正確修法是跑
`ALTER ROLE authenticator SET pgrst.db_schemas = '...'` + `NOTIFY pgrst, 'reload config'`，
詳見根目錄 [`docs/new-app-sop.md`](../../docs/new-app-sop.md) 第 3 節。

**前端 supabase client 怎麼指向 `calendar` schema**：
```js
createAppSupabase({ schema: 'calendar' })
```
之後所有 `from()` 都自動指向 `calendar.events`。

**Supabase Settings → Integrations → Data API → Exposed schemas 必須包含 `calendar`**，
否則 PostgREST 會回 404 / `PGRST106`。

---

## 資料庫結構（Supabase）

只有一張表 `events`（完整 SQL 見 `supabase/schema.sql`）：

| 欄位 | 型別 | 用途 |
|---|---|---|
| `id` | bigint (PK, identity) | 主鍵 |
| `user_id` | uuid → `auth.users(id)` | 事件擁有者（CASCADE） |
| `title` | text | 事件標題 |
| `description` | text | 備註（選填） |
| `start_at` | timestamptz | 開始時間 |
| `end_at` | timestamptz | 結束時間（選填） |
| `all_day` | boolean | 是否為全天事件 |
| `created_at` | timestamptz | 建立時間 |

**設計重點：**
- **RLS 全開，沒有分享機制** — policy 是 `auth.uid() = user_id`（select/insert/update/delete
  都一樣），純個人行程，不像 recipe-book 有 `is_shared` 這種公開機制。以後如果要加「共享行事曆」，
  這張表要新增 `is_shared` 或另開一張 `event_shares` 對照表，不要直接改 `user_id` 的語意。
- **時間一律存 `timestamptz`（UTC）**，前端用瀏覽器/裝置的本地時區顯示，靠
  `toDatetimeLocalValue`/`fromDatetimeLocalValue`（`utils.js`）轉換，沒有额外的時區欄位。
- **全天事件的 `start_at`** 存的是「選定日期的本地午夜」轉成的 UTC 時間戳，`all_day=true`
  時 UI 不顯示時間、只顯示「全天」。
- **一次載入使用者所有事件**（`db.js` 的 `loadEvents` 沒有分頁或日期範圍過濾）——刻意的
  簡化決定，個人行事曆資料量小，不值得為 v1 加分頁複雜度。如果之後事件數量大到影響效能，
  再改成依月份/週範圍查詢。

---

## Migration 檔案清單（`supabase/`）

| 檔案 | 做什麼 |
|---|---|
| `schema.sql` | 建 `calendar` schema + `events` 表 + RLS（一次跑完） |

> 目前只有一支 migration，之後有新欄位/新表再依日期新增檔案，格式跟其他 app 一致：
> `YYYY-MM-DD_描述.sql`。

---

## LINE 整合

跟 calorie-tracker / recipe-book 完全相同的實作（`src/liff.js` + `api/`），差異只有：
- `_lineLogin.js` 沒有「回填暱稱到 user_settings」那段——本 app 沒有 `user_settings` 表，
  不需要顯示暱稱
- `getSupabaseAdminForLine()` 指向 `calorie_tracker` schema（見上方「跨 app 共用 LINE 登入」）

環境變數、LIFF 設定流程完全比照其他兩個 app，見根目錄 [`docs/new-app-sop.md`](../../docs/new-app-sop.md)
的「需要 LINE LIFF」章節。

---

## 怎麼跑起來

```bash
npm install            # 第一次（在 monorepo 根目錄）
npm run dev:calendar   # 開發（http://localhost:3457）
npm run build:calendar # 打包到 apps/calendar/dist/
```

需要先建立 `.env`（見 README 或 `.env.example`）。基本功能只要
`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`；LINE 登入要
`VITE_LIFF_ID`/`LINE_CHANNEL_ID`/`SUPABASE_SERVICE_ROLE_KEY`。沒設定 LINE 相關變數會自動跳過，
當一般網頁用，不影響其他功能。
