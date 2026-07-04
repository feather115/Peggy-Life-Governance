# TY Calendar — 架構說明

> 給未來的自己（和 AI 助理）：要改某個東西時，先看這份表找到對應檔案，**不用讀整個專案**。

---

## 一句話總覽

Vite + React 19 單頁 App，個人行程管理：月/週/日三種檢視、事件（顏色+標籤）、
日記（多筆/天，標籤依分類管理）、週期性任務（標記完成自動算下次到期日）。資料存在
Supabase 的 `calendar` schema，每人只能看/改自己的資料（沒有分享機制）。需要登入才能
使用，跟 calorie-tracker、recipe-book 共用同一個 Supabase 專案的 `auth.users`，可以用
LIFF 連結在 LINE App 裡直接開啟並自動登入。

視覺風格照 Claude Design 產出的「TY Calendar Design System」設計稿實作（柔和藍主題），
分三階段落地，**三階段都已完成**：Phase 1 視覺改版 + 事件顏色/標籤、Phase 2 日記功能、
Phase 3 週期性任務。

---

## 資料流

```
Supabase ⇄ db.js ⇄ useEvents.js / useDiary.js / useTasks.js ⇄ Root.jsx / App.jsx ⇄ components/*
          (純 API)  (狀態+動作，三個獨立 hook)                  (登入閘口 / 協調)     (畫面)
```

- 元件**不會**直接呼叫 `db.js`。事件走 `useEvents()`；日記與標籤分類走 `useDiary()`；
  週期性任務走 `useTasks()`。三個 hook 平行存在，`App.jsx` 同時使用並互相傳遞需要的資料
  （例如 `DayView` 需要 `useEvents` 的事件 + `useDiary` 的日記 + `useTasks` 的當日到期
  任務，用 `utils.js` 的 `buildDayTimeline()` 合併成一條時間軸）。
- `Root.jsx` 負責：`.env` 檢查、LINE 自動登入、Email/密碼登入閘口。
- `App.jsx` 負責 520px 置中外殼，依 `editing`/`editingDiary`/`managingTags`/`editingTask`
  四個 state 切換「檢視畫面」或對應表單（互斥，同時只會有一個 overlay）。`view` 本身
  （月/週/日/任務）是 `useEvents()` 管理的狀態，任務列表雖然邏輯上跟 `useTasks()` 有關，
  但「目前在看哪個 tab」統一由 `useEvents.view` 控制，不要另外開一份 view state。

---

## 檔案地圖 — 「我要改 X，該開哪個檔？」

| 你想改的東西 | 檔案 |
|---|---|
| **配色、圓角、陰影、事件顏色選項** | `src/theme.js` |
| **月檢視（格線月曆、事件/日記/任務圓點、選中日摘要卡）** | `src/components/MonthView.jsx` |
| **週檢視（7 天直向列表，含事件+日記+任務時間軸）** | `src/components/WeekView.jsx` |
| **日檢視（事件+日記+任務合併時間軸、新增按鈕）** | `src/components/DayView.jsx` |
| **月/週/日/任務切換 tab、回到今天** | `src/components/ViewTabs.jsx` |
| **新增/編輯事件表單（標題、顏色、標籤、標題建議、全天、時間、備註、刪除）** | `src/components/EventForm.jsx` |
| **新增/編輯日記表單（分類標籤選擇、時間、地點、和誰在一起、心情筆記）** | `src/components/DiaryForm.jsx` |
| **時間選擇（預設 30 分鐘一格下拉選單，可切換手動輸入）** | `src/components/TimeSelect.jsx` |
| **設定頁入口（清單，目前只有一項）** | `src/components/Settings.jsx` |
| **管理分類與標籤（改名/刪除分類、新增/刪除標籤）** | `src/components/ManageTags.jsx` |
| **任務列表（狀態顯示、標記完成、歷史紀錄、刪除）** | `src/components/TasksView.jsx` |
| **新增/編輯任務表單（標題、重複間隔、到期日、是否顯示在行事曆）** | `src/components/TaskForm.jsx` |
| **日期運算、事件/日記分組、時間軸合併、任務間隔運算** | `src/utils.js` |
| **Supabase 查詢（events / diary_entries / tag_categories / tasks 的 CRUD）** | `src/db.js` |
| **Supabase client 連線** | `src/supabase.js`（re-export `@peggy-life/shared`） |
| **LINE LIFF 初始化與登入** | `src/liff.js` |
| **Email/密碼與 LINE 自動登入閘口** | `src/Root.jsx` |
| **Email 登入/註冊/重設密碼頁面** | `src/components/Auth.jsx` |
| **事件狀態中樞（事件清單、檢視模式、月/週/日/任務翻頁與選中日）** | `src/useEvents.js` |
| **日記狀態中樞（日記清單、分類標籤、預設分類種子）** | `src/useDiary.js` |
| **任務狀態中樞（任務清單、標記完成與下次到期日運算）** | `src/useTasks.js` |
| **主外殼、editing/editingDiary/showSettings/managingTags/editingTask state** | `src/App.jsx` |

---

## 每個檔案在幹嘛

### 核心
- **`src/main.jsx`** — 進入點，呼叫 `initLiff()` 完成後掛載 `<Root/>`。
- **`src/Root.jsx`** — 檢查 `.env` → 執行 LINE 自動登入 / Email 登入驗證 → 已登入則載入 `<App/>`。
- **`src/App.jsx`** — 520px 置中外殼，同時載入 `useEvents()` + `useDiary()` + `useTasks()`，
  依 editing/editingDiary/showSettings/editingTask（互斥）切換「月/週/日/任務檢視」或
  對應表單；header 有一顆 ⚙ 齒輪按鈕開 `showSettings`，`showSettings` 底下再依
  `managingTags` 切換 `Settings.jsx`（清單）或 `ManageTags.jsx`（實際管理畫面）。
- **`src/useEvents.js`** — ⭐ **事件狀態中樞**。載入事件、`eventsByDate`（依日期分組）、
  `view`（月/週/日/任務）、`anchorKey`（目前翻頁翻到哪個月/週/天）、`selectedDateKey`
  （月檢視裡選中的單一天，跟 `anchorKey` 分開存，翻月曆不會弄丟選中的日期）、
  `openDay(dateKey)`（月/週檢視點下去統一走這條：對齊 anchor + selected + 切到日檢視）、
  新增/編輯/刪除 action。
- **`src/useDiary.js`** — ⭐ **日記狀態中樞**。載入日記與分類、`entriesByDate`（依日期分組）、
  日記 CRUD、分類/標籤管理（新增分類、改名、刪除、新增/刪除標籤）。**新使用者第一次使用時
  如果分類是空的，會自動種一組預設分類**（工作/社交/心情/健康）方便直接上手，之後不會再種。
- **`src/useTasks.js`** — ⭐ **任務狀態中樞**。載入任務、`tasksByDueDate`（依到期日分組，
  只有 `show_on_calendar=true` 的才會進這個分組，給月/週/日檢視顯示用）、任務 CRUD、
  `confirmComplete(taskId, doneDate)`（標記完成：用 `utils.addInterval()` 算出下次到期日、
  把完成日期推進 `history` 陣列）。
- **`src/db.js`** — Supabase 的純查詢函式：events（`loadEvents`/`createEvent`/…）、
  diary_entries（`loadDiaryEntries`/`createDiaryEntry`/…）、tag_categories
  （`loadCategories`/`createCategories`/`updateCategory`/`deleteCategory`）、tasks
  （`loadTasks`/`createTask`/`updateTask`/`deleteTask`）。
- **`src/supabase.js`** — re-export `@peggy-life/shared` 的 supabase client（`schema: 'calendar'`）。
- **`src/liff.js`** — LINE LIFF 初始化、LINE 自動登入及帳號綁定（跟其他 app 共用同一套邏輯）。

### 無狀態工具
- **`src/theme.js`** — 視覺常數集中地：`THEME`（配色/圓角/陰影）、`EVENT_COLORS`
  （事件顏色選項，7 色）、`categoryAccentForTag(tag, categories)`（日記標籤依所屬分類
  在清單裡的順序固定分配一個強調色，不是存在資料庫裡的欄位）。
- **`src/utils.js`** — 日期字串轉換（`dateKeyFrom`/`parseDateKey`）、月曆格線
  （`getMonthDays`）、週的 7 天（`getWeekDays`）、事件/日記分組（`groupEventsByDate`/
  `groupDiaryByDate`）、`buildDayTimeline(events, diaryEntries, tasksDueToday)`（把某天的
  事件+日記+到期任務合併成一條依時間排序的時間軸，Month/Week/Day 三個檢視共用同一個函式，
  行為才會一致）、`addInterval(dateKey, value, unit)` / `diffDays(a, b)`（任務的到期日運算）、
  `<input type="datetime-local">` 字串轉換。

### 畫面（`src/components/`）
- **`ViewTabs.jsx`** — 月/週/日/任務四個 tab + 「今天」按鈕（`view==='tasks'` 時不顯示，
  任務列表沒有「翻頁到某一天」的概念）。
- **`MonthView.jsx`** — 格線月曆，日期下方顯示事件顏色圓點（最多 3 個不同色）+ 日記圓點
  （固定用 `theme.primaryDark`）+ 任務小方點（`theme.textMuted`），圖例列說明三種點
  代表什麼。點日期只會「選中」（`onSelectDay`），不離開月檢視；下方的「選中日摘要卡」
  顯示該天的合併時間軸，點摘要卡標題才會呼叫 `onOpenDay` 跳去日檢視。
- **`WeekView.jsx`** — 一週 7 天直向列表，每天顯示事件+日記+到期任務合併時間軸，
  點某一天呼叫 `onOpenDay` 跳去日檢視。
- **`DayView.jsx`** — 單日事件+日記+任務合併時間軸（`buildDayTimeline`），事件卡片顯示
  顏色點/時間/標題/描述/標籤，日記卡片顯示時間/標籤（依分類上色）/地點/同伴/心情筆記，
  任務卡片顯示虛線邊框+核取方塊圖示（點擊呼叫 `onGoToTasks` 切到任務檢視，不能直接在
  這裡標記完成——完成流程需要選日期，統一在任務檢視操作），可切換前一天/後一天，底部
  並排「＋ 新增事件」「＋ 新增日記」兩個按鈕（新增動作只從日檢視發起，月/週檢視只負責
  導覽——見下方原因說明）。
- **`EventForm.jsx`** — 新增/編輯事件表單：標題（新增模式下輸入時會列出過去用過的相同
  標題建議，點擊帶入標題+顏色）、7 色顏色選擇器、標籤（Enter 加入的 chip 輸入）、
  全天開關（切換是否顯示時間欄位）、開始/結束時間（日期 `<input type="date">` +
  `TimeSelect`）、描述、刪除（兩段確認）。
- **`DiaryForm.jsx`** — 新增/編輯單筆日記：已選標籤即時預覽、全天切換、時間/結束時間
  （`TimeSelect`）、地點、和誰在一起（逗號/頓號分隔的文字輸入，存入前轉成陣列）、
  心情筆記、依分類分組的標籤選擇卡片（點擊 toggle 選取狀態）、刪除（兩段確認）。
  **不含**「管理分類與標籤」入口——那個入口移到設定頁了（見下）。
- **`TimeSelect.jsx`** — 時間選擇元件，`EventForm.jsx`/`DiaryForm.jsx` 共用：預設是
  0:00～23:30、每 30 分鐘一格的 `<select>`（原生 `<input type="time" step="1800">` 在
  多數瀏覽器裡點按鈕還是以 1 分鐘為單位滾動，`step` 屬性對 UI 不生效，所以改用真正的
  下拉選單）；選單最後一項「自訂時間…」會切換成原生 `<input type="time">`，可以輸入
  任意分鐘，切回去按「整點/半點」；如果傳入的 `value` 本來就不是 30 分鐘的倍數（例如
  舊資料或手動輸入過），下拉選單會自動多出一個「HH:MM（自訂）」的選項顯示目前值，
  不會憑空把值改掉。
- **`Settings.jsx`** — 設定頁清單，從 header ⚙ 按鈕進入，目前只有一列「管理分類與標籤」，
  點下去切到 `ManageTags.jsx`；之後有新設定項目直接加在這個清單裡。
- **`ManageTags.jsx`** — 管理分類與標籤：點分類名稱進入改名模式（Enter/失焦確認）、
  刪除分類（兩段確認，會連動清掉既有日記裡用到這些標籤的紀錄，見 `useDiary.js`
  的 `deleteCategory`）、每個分類卡片內新增/刪除標籤、底部新增分類、卡片左上角
  ▲▼ 按鈕調整分類順序（呼叫 `useDiary.js` 的 `moveCategory`，跟相鄰分類互換
  `sort_order` 後在前端重新排序，邊界按鈕會 disable）。原本是從日記表單裡的連結
  進入，現在改成設定頁底下的子頁（`App.jsx` 的 `showSettings` + `managingTags`
  兩層 state），因為塞在日記表單流程裡不容易發現、也跟「寫日記」這個當下動作無關。
- **`TasksView.jsx`** — 任務列表，依到期日排序，狀態文字依 `diffDays` 顯示「已逾期 N 天」
  （紅）/「今天到期」（主色）/「N 天後到期」（灰）。每筆有「標記完成」（點開會出現日期
  選擇器，預設今天，確認後呼叫 `onConfirmComplete`）、「歷史紀錄 (N)」（有完成過才顯示，
  展開列出過去完成日期）、「刪除」（兩段確認）。`show_on_calendar=false` 的任務會標註
  「不會顯示在行事曆」。
- **`TaskForm.jsx`** — 新增/編輯任務：標題、重複間隔（數字 + 天/週/個月 三段式選擇器）、
  到期日（新增時欄位標籤是「起始到期日」，編輯時是「下次到期日」，因為編輯已存在的任務
  時這個欄位代表的意義變了）、「顯示在行事曆」開關。**這個表單本身沒有刪除按鈕**——
  刪除任務的操作在 `TasksView.jsx` 的列表項目上，不在編輯表單裡（跟 Event/Diary 表單
  的刪除放在表單內不一樣，因為設計稿就是這樣分的，任務的刪除更像列表操作而非編輯操作）。
- **`Auth.jsx`** — 登入介面：Email + 密碼登入、註冊、忘記密碼，跟其他 app 風格一致。

---

## 為什麼「新增事件/日記」只能從日檢視發起，「標記完成任務」只能在任務檢視發起

月檢視、週檢視都只負責「導覽」（點日期 → 跳到日檢視），不各自帶一個「新增」按鈕。
原因：月/週檢視一次顯示多天，如果每個檢視都各自提供快速新增，容易搞不清楚「新增的內容
會落在哪一天」。統一從日檢視新增，日期永遠是畫面上明確顯示的那一天，不會誤植日期。

同樣的道理，日檢視裡的任務卡片點下去是導覽到任務檢視（`onGoToTasks`），不是直接在
日檢視內完成標記——因為標記完成需要選「完成日期」，這個操作屬於任務本身的生命週期管理，
跟看「今天有什麼」的日檢視是不同層次的操作，混在一起容易誤觸。

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
詳見根目錄 [`docs/new-app-sop.md`](../../docs/new-app-sop.md) 第 3 節。（本 app 沒有
`user_settings` 表，`_lineLogin.js` 沒有「回填暱稱」那段，跟另外兩個 app 稍微不同。）

**前端 supabase client 怎麼指向 `calendar` schema**：
```js
createAppSupabase({ schema: 'calendar' })
```
之後所有 `from()` 都自動指向 `calendar.events`。

**Supabase Settings → Integrations → Data API → Exposed schemas 必須包含 `calendar`**，
否則 PostgREST 會回 404 / `PGRST106`。

---

## 資料庫結構（Supabase）

三張表，都在 `calendar` schema：

### `events`（完整 SQL 見 `supabase/schema.sql` + `2026-07-02_event_color_tags.sql` +
`2026-07-04_event_location.sql`）

| 欄位 | 型別 | 用途 |
|---|---|---|
| `id` | bigint (PK, identity) | 主鍵 |
| `user_id` | uuid → `auth.users(id)` | 事件擁有者（CASCADE） |
| `title` | text | 事件標題 |
| `description` | text | 備註（選填） |
| `location` | text | 地點（選填，Day 檢視顯示在描述上方，帶 📍） |
| `start_at` | timestamptz | 開始時間 |
| `end_at` | timestamptz | 結束時間（選填） |
| `all_day` | boolean | 是否為全天事件 |
| `color` | text | 顏色（`EVENT_COLORS` 其中一個 hex，選填） |
| `tags` | text[] | 標籤（自由輸入，不受分類系統管理，跟日記標籤是兩套獨立機制） |
| `created_at` | timestamptz | 建立時間 |

### `diary_entries`（完整 SQL 見 `supabase/2026-07-02_diary.sql`）

| 欄位 | 型別 | 用途 |
|---|---|---|
| `id` | bigint (PK, identity) | 主鍵 |
| `user_id` | uuid → `auth.users(id)` | 擁有者（CASCADE） |
| `entry_date` | date | 這則日記屬於哪一天（不是 timestamptz，日記本來就是「屬於某天」不是某個精確時刻） |
| `all_day` | boolean | 全天日記（不記錄時間） |
| `time` / `end_time` | text | `HH:MM` 字串（不用 `time` 型別，避免時區/格式化的額外複雜度，反正只是顯示用） |
| `location` | text | 地點（選填） |
| `people` | text[] | 和誰在一起（自由輸入文字用逗號/頓號分隔，存進來前轉陣列） |
| `tags` | text[] | 選中的標籤（必須是某個 `tag_categories.tags` 裡的字串，但沒有資料庫層級外鍵約束，
  刪除分類/標籤時由前端 `useDiary.js` 主動同步清掉） |
| `note` | text | 心情筆記（選填） |
| `created_at` | timestamptz | 建立時間 |

### `tag_categories`（完整 SQL 見 `supabase/2026-07-02_diary.sql` + `2026-07-05_category_sort_order.sql`）

| 欄位 | 型別 | 用途 |
|---|---|---|
| `id` | bigint (PK, identity) | 主鍵 |
| `user_id` | uuid → `auth.users(id)` | 擁有者（CASCADE），每人的分類/標籤互不相通 |
| `name` | text | 分類名稱（工作/社交/心情/健康…） |
| `tags` | text[] | 這個分類底下的標籤，**不是獨立一張表**，直接存陣列 |
| `sort_order` | int | 使用者自訂的顯示順序（`ManageTags.jsx` 的 ▲▼ 按鈕調整），`loadCategories`
  依此排序，不是 `created_at` |
| `created_at` | timestamptz | 建立時間 |

### `tasks`（完整 SQL 見 `supabase/2026-07-02_tasks.sql`）

| 欄位 | 型別 | 用途 |
|---|---|---|
| `id` | bigint (PK, identity) | 主鍵 |
| `user_id` | uuid → `auth.users(id)` | 擁有者（CASCADE） |
| `title` | text | 任務標題 |
| `interval_value` | int | 重複間隔的數字（例：3） |
| `interval_unit` | text | `day`/`week`/`month`（DB check constraint 限制只能是這三個值之一） |
| `next_due` | date | 下次到期日 |
| `last_done` | date | 上次完成日期（nullable，從沒完成過就是 null） |
| `show_on_calendar` | boolean | 是否要在月/週/日檢視顯示到期提醒 |
| `history` | date[] | 完成歷史（跟 `tag_categories.tags` 一樣，直接存陣列不另開子表） |
| `created_at` | timestamptz | 建立時間 |

**設計重點：**
- **RLS 全開，沒有分享機制** — 四張表的 policy 都是 `auth.uid() = user_id`
  （select/insert/update/delete 都一樣），純個人行程，不像 recipe-book 有 `is_shared`
  這種公開機制。以後如果要加「共享行事曆」，這幾張表都要新增 `is_shared` 或另開對照表，
  不要直接改 `user_id` 的語意。
- **任務的下次到期日運算是前端算好才寫回 DB，不是資料庫 trigger** — `useTasks.js` 的
  `confirmComplete()` 呼叫 `utils.addInterval(doneDate, intervalValue, intervalUnit)`
  算出 `next_due`，直接連同 `last_done`、`history` 一起 update。如果之後要在其他地方
  （例如伺服器端排程）也需要算這個邏輯，記得 `addInterval` 的邏輯要一併搬過去，不要
  假設資料庫會自動處理。
- **標籤沒有正規化成獨立表** — `tag_categories.tags` 直接存文字陣列，`diary_entries.tags`
  也是文字陣列存標籤字串本身（不是外鍵 ID）。優點是 CRUD 簡單（改分類名稱不用管
  join，刪標籤就是從陣列拿掉一個字串）；代價是「改標籤名稱」等於「這個標籤在所有
  地方都變成新字串，跟舊字串的日記對不上」——目前沒有改標籤名稱的 UI（只有新增/刪除），
  所以還沒踩到這個限制，但以後如果要加「重新命名標籤」功能，要一併更新所有引用該標籤的
  `diary_entries.tags`，不能只改 `tag_categories.tags`。
- **時間一律存 `timestamptz`（UTC，events 表）**，前端用瀏覽器/裝置的本地時區顯示，靠
  `toDatetimeLocalValue`/`fromDatetimeLocalValue`（`utils.js`）轉換，沒有额外的時區欄位。
  日記的 `entry_date`/`time` 則是分開存日期跟時間字串（見上方 diary_entries 說明）。
- **全天事件的 `start_at`** 存的是「選定日期的本地午夜」轉成的 UTC 時間戳，`all_day=true`
  時 UI 不顯示時間、只顯示「全天」。
- **一次載入使用者所有資料**（`loadEvents`/`loadDiaryEntries`/`loadCategories` 都沒有分頁
  或日期範圍過濾）——刻意的簡化決定，個人行事曆資料量小，不值得為 v1 加分頁複雜度。
  如果之後資料量大到影響效能，再改成依月份/週範圍查詢。
- **新使用者的預設分類是應用層邏輯，不是資料庫 trigger** — `useDiary.js` 載入完
  `tag_categories` 後如果是空的才會呼叫 `createCategories` 種預設值，只會發生一次
  （種完之後 `tag_categories` 就不是空的了）。

---

## Migration 檔案清單（`supabase/`）

| 檔案 | 做什麼 |
|---|---|
| `schema.sql` | 建 `calendar` schema + `events` 表 + RLS（一次跑完） |
| `2026-07-02_event_color_tags.sql` | `events` 加 `color`、`tags` 欄位（Phase 1 視覺改版） |
| `2026-07-02_diary.sql` | 建 `diary_entries` + `tag_categories` 表 + RLS（Phase 2 日記功能） |
| `2026-07-02_tasks.sql` | 建 `tasks` 表 + RLS（Phase 3 週期性任務） |
| `2026-07-04_event_location.sql` | `events` 加 `location` 欄位 |
| `2026-07-05_category_sort_order.sql` | `tag_categories` 加 `sort_order` 欄位並依 `created_at` backfill 既有資料 |

> 新環境依序跑：`schema.sql` → `2026-07-02_event_color_tags.sql` → `2026-07-02_diary.sql`
> → `2026-07-02_tasks.sql` → `2026-07-04_event_location.sql` → `2026-07-05_category_sort_order.sql`。
> 之後有新欄位/新表再依日期新增檔案，格式跟其他 app 一致：
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
