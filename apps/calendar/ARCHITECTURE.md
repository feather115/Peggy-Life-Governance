# TY Calendar — 架構說明

> 給未來的自己（和 AI 助理）：要改某個東西時，先看這份表找到對應檔案，**不用讀整個專案**。

---

## 一句話總覽

Vite + React 19 單頁 App，個人行程管理：月/週/日三種檢視、**紀錄**（事件與日記合併後的
單一實體，見下）、週期性任務（標記完成自動算下次到期日）。資料存在
Supabase 的 `calendar` schema，每人只能看/改自己的資料（沒有分享機制）。需要登入才能
使用，跟 calorie-tracker、recipe-book 共用同一個 Supabase 專案的 `auth.users`，可以用
LIFF 連結在 LINE App 裡直接開啟並自動登入。

**2026-07-15 事件與日記合併成單一「紀錄」**：一筆行程過期後其實就是日記，兩者是同一列
在時間軸上的前後階段，不是兩種東西。所以合併成一張表（`events`）、一個狀態中樞
（`useRecords`）、一份表單（`RecordForm`）。一筆紀錄有**計畫面**（`title`/`color`/
`description`/選項庫 `tags`）與**回顧面**（`note`/分類 `diary_tags`/`tag_details`/
`hashtags`）；過期的計畫補上回顧面就成了日記。標籤字彙仍分兩套並存不合併：選項庫
`tags`（「這是什麼」）與分類 `diary_tags`（「感受」）。**合併需要跑 migration
`2026-07-15_merge_diary_into_events.sql`**（把 `diary_entries` 併進 `events`、時間以
Asia/Taipei 換算成 `start_at`），跑完前新版程式碼會查不到新欄位。

視覺風格照 Claude Design 產出的「TY Calendar Design System」設計稿實作（柔和藍主題）。

---

## 資料流

```
Supabase ⇄ db.js ⇄ useRecords.js / useDiaryTags.js / useTasks.js / useOptions.js ⇄ Root.jsx / App.jsx ⇄ components/*
          (純 API)  (狀態+動作，四個獨立 hook)                                    (登入閘口 / 協調)     (畫面)
```

- 元件**不會**直接呼叫 `db.js`。紀錄（事件+日記）走 `useRecords()`；日記的分類標籤字彙
  走 `useDiaryTags()`；週期性任務走 `useTasks()`；地點/人名/事件標籤選項庫走 `useOptions()`。
  四個 hook 平行存在，`App.jsx` 同時使用並互相傳遞需要的資料
  （例如 `DayView` 需要 `useRecords` 的紀錄 + `useTasks` 的當日到期任務，用 `utils.js` 的
  `buildDayTimeline()` 合併成一條時間軸）。**`useDiaryTags` 只管標籤分類本身**，標籤實際
  貼在哪筆紀錄存在 `useRecords` 的 `diary_tags`；改名/刪除分類標籤時透過 `App.jsx` 傳入的
  `recordSync`（`useRecords.renameDiaryTagEverywhere` / `removeDiaryTagsEverywhere`）同步過去紀錄。
- `Root.jsx` 負責：`.env` 檢查、LINE 自動登入、Email/密碼登入閘口。
- `App.jsx` 負責 520px 置中外殼，用**單一 `overlay` state 物件**切換「檢視畫面」或對應表單
  （互斥，同時只會有一個 overlay，type 有 `record`/`task`/`settings`/`manageTags`/`manageOptions`）。
  `view` 本身（月/週/日/任務）是 `useRecords()` 管理的狀態，任務列表雖然邏輯上跟
  `useTasks()` 有關，但「目前在看哪個 tab」統一由 `useRecords.view` 控制，不要另外開一份 view state。

---

## 檔案地圖 — 「我要改 X，該開哪個檔？」

| 你想改的東西 | 檔案 |
|---|---|
| **配色、圓角、陰影、事件顏色選項** | `src/theme.js` |
| **月檢視（格線月曆、紀錄/任務圓點、選中日摘要卡）** | `src/components/MonthView.jsx` |
| **週檢視（7 天直向列表，含紀錄+任務時間軸）** | `src/components/WeekView.jsx` |
| **日檢視（紀錄+任務合併時間軸、新增按鈕）** | `src/components/DayView.jsx` |
| **月/週/日/任務切換 tab、回到今天** | `src/components/ViewTabs.jsx` |
| **時間軸卡的共用渲染（紀錄卡/任務卡、分類標籤 chip、地點/同伴小字）** | `src/components/TimelineItems.jsx` |
| **新增/編輯紀錄表單（計畫面：標題/顏色/標籤/備註；回顧面：今天感覺/＃注記/分類標籤，可收合）** | `src/components/RecordForm.jsx` |
| **時間選擇（預設 30 分鐘一格下拉選單，可切換手動輸入）** | `src/components/TimeSelect.jsx` |
| **地點/和誰的歷史選單輸入（下拉選歷史值，可切自行輸入，人名顯示成 tag chips）** | `src/components/HistoryFields.jsx` |
| **設定頁（帳號/暱稱/LINE 連結、管理標籤入口、登出）** | `src/components/Settings.jsx` |
| **管理日記分類與標籤（三層：分類→主標籤→子標籤；改名/刪除/排序/收合）** | `src/components/ManageTags.jsx` |
| **管理地點、人名與事件標籤（改名同步、封存、刪除、子標籤）** | `src/components/ManageOptions.jsx` |
| **任務列表（狀態顯示、標記完成、歷史紀錄、刪除）** | `src/components/TasksView.jsx` |
| **新增/編輯任務表單（標題、重複間隔、到期日、是否顯示在行事曆）** | `src/components/TaskForm.jsx` |
| **日期運算、紀錄分組、時間軸合併、任務間隔運算** | `src/utils.js` |
| **Supabase 查詢（events / tag_categories / tasks / event_options 的 CRUD）** | `src/db.js` |
| **Supabase client 連線** | `src/supabase.js`（re-export `@peggy-life/shared`） |
| **LINE LIFF 初始化與登入** | `src/liff.js` |
| **Email/密碼與 LINE 自動登入閘口** | `src/Root.jsx` |
| **Email 登入/註冊/重設密碼頁面** | `src/components/Auth.jsx` |
| **紀錄狀態中樞（紀錄清單、檢視模式、翻頁與選中日、tagDetailHistory、diary_tags 同步）** | `src/useRecords.js` |
| **日記分類標籤字彙狀態中樞（分類、預設分類種子、標籤 CRUD）** | `src/useDiaryTags.js` |
| **任務狀態中樞（任務清單、標記完成與下次到期日運算）** | `src/useTasks.js` |
| **選項庫狀態中樞（地點/人名/事件標籤選單、改名合併、封存）** | `src/useOptions.js` |
| **主外殼、overlay state（單一物件管理所有覆蓋畫面）** | `src/App.jsx` |

---

## 每個檔案在幹嘛

### 核心
- **`src/main.jsx`** — 進入點，呼叫 `initLiff()` 完成後掛載 `<Root/>`。
- **`src/Root.jsx`** — 檢查 `.env` → 執行 LINE 自動登入 / Email 登入驗證 → 已登入則載入 `<App/>`。
- **`src/App.jsx`** — 520px 置中外殼，同時載入 `useRecords()` + `useDiaryTags()` + `useTasks()` + `useOptions()`。
  所有覆蓋畫面（紀錄/任務表單、設定、管理標籤/選項）用**單一 `overlay` state 物件**管理
  （`null | { type: 'record'|'task', mode, ... } | { type: 'settings' } |
  { type: 'manageTags' } | { type: 'manageOptions' }`），`renderOverlay()` 依 type switch。
  header 只剩標題 + ⚙ 齒輪按鈕（開設定頁），登出按鈕移到設定頁裡（跟
  calorie-tracker/recipe-book 一致，手機上省一顆常駐按鈕）。地點/人名/事件標籤的
  選單資料來自 `useOptions()` 的 `menus`，傳給 `RecordForm`；紀錄存檔後呼叫
  `opts.ensureNames()` 把新出現的名字自動補進選項庫。**`useDiaryTags` 的 `recordSync`
  在這裡接線**：把 `useRecords.renameDiaryTagEverywhere` / `removeDiaryTagsEverywhere`
  傳進去，分類標籤改名/刪除才能同步過去紀錄的 `diary_tags`。
- **`src/useRecords.js`** — ⭐ **紀錄狀態中樞**（事件與日記合併後的單一實體）。載入紀錄、
  `recordsByDate`（依 `start_at` 本地日期分組）、`view`（月/週/日/任務，**預設 `'day'`**——
  開 app 直接看「今天要幹嘛」）、`anchorKey`（翻頁翻到哪個月/週/天）、`selectedDateKey`
  （月檢視選中的單一天，跟 `anchorKey` 分開存，翻月曆不會弄丟選中的日期）、
  `openDay(dateKey)`（月/週檢視點下去統一走這條：對齊 anchor + selected + 切到日檢視）、
  紀錄 CRUD（`createRecord`/`updateRecord`/`deleteRecord`）、`renameFieldValue(field, …)`
  （選項庫改名時改寫過去紀錄的 `locations`/`people`/`tags`，都是 text[]）、`tagDetailHistory`
  （`Map<tag, string[]>`，把所有紀錄裡每個分類標籤填過的細節文字去重、依 `start_at` 新到舊排序，
  給 `RecordForm` 的細節輸入框當 `<datalist>`）、以及給 `useDiaryTags` 用的
  `renameDiaryTagEverywhere` / `removeDiaryTagsEverywhere`（分類標籤改名/刪除同步到紀錄的
  `diary_tags`；刪除比照原本行為只更新本地 state）。
- **`src/useDiaryTags.js`** — ⭐ **日記分類標籤字彙狀態中樞**（`tag_categories` 表）。
  **只管標籤分類本身**（不含紀錄）：載入分類、分類/標籤管理（新增分類、改名、刪除、
  新增/刪除/改名/排序主標籤與子標籤——`addSubTag`/`renameSubTag`/`removeSubTag`/`moveSubTag`）。
  標籤實際貼在哪筆紀錄存在 `useRecords.diary_tags`，所以改名/刪除標籤時呼叫建構參數傳入的
  `recordSync.renameTag` / `recordSync.removeTags` 同步過去紀錄。**新使用者第一次使用時
  如果分類是空的，會自動種一組預設分類**（工作/社交/心情/健康），之後不會再種。
  `tags` 的形狀是 `[{ name, subs: [] }]`（jsonb）；載入時 `normalizeCategories()` 會把
  migration 前的純字串陣列包成新格式。`findTagOwner(categories, name)`（具名 export）是
  「標籤名稱全域唯一（含子標籤）」檢查的單一入口，`ManageTags.jsx` 也用它。
- **`src/useTasks.js`** — ⭐ **任務狀態中樞**。載入任務、`tasksByDueDate`（依到期日分組，
  只有 `show_on_calendar=true` 的才會進這個分組，給月/週/日檢視顯示用）、任務 CRUD、
  `confirmComplete(taskId, doneDate)`（標記完成：用 `utils.addInterval()` 算出下次到期日、
  把完成日期推進 `history` 陣列）。
- **`src/useOptions.js`** — ⭐ **選項庫狀態中樞**（地點/人名/事件標籤，`event_options` 表）。
  `menus`（表單下拉選單資料：未封存的地點/人名字串陣列 + 標籤 `{ value, label }` 陣列，
  子標籤縮排、母標籤封存整組不出現）、`ensureNames()`（事件/日記存檔後把新名字自動補進
  選項庫，再次使用已封存名稱時會自動恢復，失敗只警告不擋存檔）、
  `addOption`/`setArchived`/`removeOption`、
  `renameOption()`（同層同名自動合併：子標籤搬到目標下、同名子標籤消掉；回傳
  `{ kind, oldName, newName }` 讓 `ManageOptions.jsx` 同步改寫過去的紀錄）。
  **跟其他 hook 不同：載入失敗不擋整個 app**——選單退化成純文字輸入，`loadError`
  只在設定頁的維護頁顯示（例如 migration 還沒跑）。
- **`src/db.js`** — Supabase 的純查詢函式：events（合併後的紀錄，`loadRecords`/`createRecord`/
  `updateRecord`/`deleteRecord`，`RECORD_COLUMNS` 是計畫面+回顧面欄位聯集）、tag_categories
  （`loadCategories`/`createCategories`/`updateCategory`/`deleteCategory`）、tasks
  （`loadTasks`/`createTask`/`updateTask`/`deleteTask`）、event_options
  （`loadOptions`/`createOptions`/`updateOption`/`deleteOption`）、使用者暱稱
  （`loadMyDisplayName`/`updateDisplayName`，查的是跨 app 共用的 `shared.user_profiles`，
  用 `.schema('shared')` 切換查詢目標，不是另開一個 client）。
- **`src/supabase.js`** — re-export `@peggy-life/shared` 的 supabase client（`schema: 'calendar'`）。
- **`src/liff.js`** — 薄殼：把本 app 的 supabase client 綁進
  `@peggy-life/shared/lineAuth` 的 `createLineAuth()`（三個 app 共用同一份 LINE 邏輯，
  要改行為去 `packages/shared/src/lineAuth.js` 改）。提供 `initLiff()`、`lineAutoLogin()`、
  `canLinkLine()`、`linkLineAccount()`、`checkLineLinked()`（給 `Settings.jsx` 的
  `LineLinker` 用，任何瀏覽器都能查）。**`@line/liff` 是動態 import**：只有「有設
  `VITE_LIFF_ID` 且 user agent 含 `Line/`（LINE in-app browser）」才會下載 liff SDK
  （獨立 chunk 約 119kB），一般瀏覽器完全不載入，主 bundle 變小。行為跟載入後再檢查
  等價——`isInClient()` 為 false 時所有 LINE 功能本來就不會啟動。

### 無狀態工具
- **`src/theme.js`** — 視覺常數集中地：`THEME`（配色/圓角/陰影）、`EVENT_COLORS`
  （事件顏色選項，7 色）、`categoryAccentForTag(tag, categories)`（日記標籤依所屬分類
  在清單裡的順序固定分配一個強調色，不是存在資料庫裡的欄位）。
- **`src/utils.js`** — 日期字串轉換（`dateKeyFrom`/`parseDateKey`）、月曆格線
  （`getMonthDays`）、週的 7 天（`getWeekDays`）、紀錄分組（`groupRecordsByDate`，依
  `start_at` 本地日期）、`formatRecordTime(record)`（計時卡的 HH:mm，有 `end_at` 顯示區間）、
  `buildDayTimeline(records, tasksDueToday)`（把某天的紀錄+到期任務合併成一條依時間排序的
  時間軸，Month/Week/Day 三個檢視共用同一個函式，行為才會一致；紀錄排序 key 用
  `formatTime()` 轉本地時間——`start_at` 是 UTC 字串，直接 slice 會拿到 UTC 時刻而錯位）、
  `addInterval(dateKey, value, unit)` / `diffDays(a, b)`（任務的到期日運算）、
  `<input type="datetime-local">` 字串轉換。

### 畫面（`src/components/`）
- **`ViewTabs.jsx`** — 月/週/日/任務四個 tab + 「今天」按鈕（`view==='tasks'` 時不顯示，
  任務列表沒有「翻頁到某一天」的概念）。
- **`TimelineItems.jsx`** — ⭐ **時間軸卡片的共用渲染**。之前 Week/Month/Day 各自複製
  一份渲染邏輯，連續好幾個需求都要三個檢視改三遍，所以抽出來：Week 的每日清單、Month
  的選中日摘要卡、Day 的當日清單**全部**直接用 `<TimelineItems>`。合併後只剩兩種項目：
  **紀錄卡（record）** 與 **任務卡（task）**。紀錄卡是白卡版型（`THEME.border` 邊框）、
  **時間獨立一行放卡片頂端**（13px 粗體，`formatRecordTime`），由上而下把有的欄位疊出來：
  顏色點+`title`（僅有標題時顯示顏色點；計時卡 15px、**全天卡 17px**——全天卡沒有時間列，靠大標題做層次）→
  `description`（計畫備註）→ `note`（今天的感覺，`pre-wrap`）→ ＃`hashtags` pill（深藍
  `hashtagBg`/`hashtagInk`）→ 選項庫 `tags` 中性 chip → 分隔線 → 底部一行（`footerRow`）：
  分類 `diary_tags`（`DiaryTags`，依分類上色）後面同一行接資訊列（每個地點各自一個 📍 span、
  同伴合併一個 👤 span、超過 3 人顯示 `+N`，共用 `<MetaRow>`）。分隔線只在下段有內容時出現；
  什麼都沒有的紀錄顯示「✎ 這則紀錄還沒有內容」。任務卡是虛線邊框 + ☐ + 「任務 · 每 X 一次」。
  `onRecordClick`/`onTaskClick` 是選填 prop：有傳項目才可點（Day/Month 用，直接開編輯），
  沒傳就純顯示（Week 用，整個日列本身已經可點）。
- **`MonthView.jsx`** — 格線月曆，日期下方顯示紀錄顏色圓點（最多 3 個不同色，沒設顏色的
  紀錄退回 `theme.primaryDark`）+ 任務小方點（`theme.textMuted`），圖例列說明兩種點。
  點日期只會「選中」（`onSelectDay`），不離開月檢視；下方的「選中日摘要卡」用
  `<TimelineItems>` 顯示該天的合併時間軸，**摘要卡裡的項目可以直接點**——紀錄點了直接開
  編輯表單、任務點了跳任務檢視（`onEditRecord`/`onGoToTasks`，`App.jsx` 傳入），不用先繞
  去日檢視；點摘要卡標題列才是 `onOpenDay` 跳日檢視。
- **`WeekView.jsx`** — 一週 7 天直向列表，週導覽是獨立白色區塊；每天的日期標題依序用
  淺藍、深藍色帶交錯區分，下方用 `<TimelineItems>` 顯示紀錄+到期任務合併時間軸
  （純顯示、不傳 click handler），點某一天呼叫 `onOpenDay` 跳去日檢視。
- **`DayView.jsx`** — 單日紀錄+任務合併時間軸（`buildDayTimeline` + `<TimelineItems>`，
  卡片版型見上），任務卡點擊呼叫 `onGoToTasks` 切到任務檢視（不能直接在這裡標記完成——
  完成流程需要選日期，統一在任務檢視操作），可切換前一天/後一天，底部一顆「＋ 新增紀錄」
  按鈕（合併前是「＋ 新增事件」「＋ 新增日記」兩顆；新增動作只從日檢視發起，月/週檢視只
  負責導覽——見下方原因說明）。
- **全天項目的呈現** — 跟計時項目**同一套卡片版型**，只差兩件事：**不顯示時間列**
  （不寫「全天」文字——使用者反饋在時間位置寫「全天」很生硬），**底色改稍深的淺藍**
  （`allDayCard`＝`THEME.primarySoft`、無邊框）跟白卡區分。淺藍底上的 chip 要換
  白底才不會被吃掉：分類標籤 chip 走 `DiaryTags onTint`、＃注記 pill 與選項庫標籤
  chip 直接換 `THEME.surface`（`hashtagBg` 跟 `primarySoft` 剛好同色）。
- **`RecordForm.jsx`** — 新增/編輯紀錄的**單一表單**（合併前的 `EventForm` + `DiaryForm`）。
  頂部是時間區（全天開關、開始/結束時間，日期 `<input type="date">` + `TimeSelect`）+
  地點/和誰（`HistoryFields.jsx` 的 `PeopleSelect` 多選，地點與和誰同一套）。下面分兩區：
  **計畫**（標題——新增模式輸入時列出過去相同標題建議，點擊帶入標題+顏色；7 色顏色選擇器；
  選項庫標籤 `PeopleSelect`；備註 `description`）與 **回顧 · 心情**（今天的感覺 `note`；
  ＃快速注記 `hashtags`——Enter/「加入」變深藍 chip、＃由系統加、前導 #/＃ 會被剝掉、重複
  不再加；依分類分組的標籤選擇卡片 `CategoryTagCard`，選取狀態存 `diary_tags`）。
  **回顧區可收合**：已有回顧內容、或這筆 `start_at` 在現在之前（過期＝可回顧）時預設展開，
  否則收起成一顆「＋ 補上心情 / 回顧」按鈕——對應「行程過了再補心情」的心智。
  「儲存」固定在 header 右側、返回鍵在左上，**未儲存變更防呆**：mount 記欄位 JSON 快照，
  返回時有差異先 `window.confirm`。`CategoryTagCard` 是內部元件：分類卡右上角一顆小「＋」
  展開輸入框新增標籤（Enter/按鈕送出；名字若已在別分類存在不建重複、直接選起來並提示）；
  標籤 chip 列表下方，若這分類有標籤被選中就列出「標籤名稱 + 細節輸入框」（`tag_details`），
  只顯示屬於這分類且選中的標籤、取消選取時清掉對應細節不留孤兒 key；細節輸入框 `list` 接原生
  `<datalist>`，選項是 `useRecords.tagDetailHistory`（同一標籤過去填過的細節，去重、最近的優先）。
- **`TimeSelect.jsx`** — 時間選擇元件，`RecordForm.jsx` 使用：預設是
  0:00～23:30、每 30 分鐘一格的 `<select>`（原生 `<input type="time" step="1800">` 在
  多數瀏覽器裡點按鈕還是以 1 分鐘為單位滾動，`step` 屬性對 UI 不生效，所以改用真正的
  下拉選單）；選單最後一項「自訂時間…」會切換成原生 `<input type="time">`，可以輸入
  任意分鐘，切回去按「整點/半點」；如果傳入的 `value` 本來就不是 30 分鐘的倍數（例如
  舊資料或手動輸入過），下拉選單會自動多出一個「HH:MM（自訂）」的選項顯示目前值，
  不會憑空把值改掉。
- **`HistoryFields.jsx`** — 地點/和誰/標籤的輸入元件，`RecordForm.jsx` 使用。
  **預設是文字輸入框**：打字時下方即時列出包含相同字的歷史
  選項（包含與輸入內容完全相同的名稱；dashed 圓 chip，最多 5 筆，點一下帶入），
  按 Enter、按「加入」或直接離開輸入框都會加入目前文字；想瀏覽全部才按「清單」切換成
  `<select>`（選完或失焦就回到輸入框）。選項資料來自 `useOptions()` 的 `menus`
  （`event_options` 選項庫裡未封存的項目），但地點/人名傳進表單前會先經過 `App.jsx` 的
  `recentMenus`（useMemo）**依「最近一次使用」重排**：從紀錄（`start_at`）算每個名字最近
  出現的時間，越近越前面、沒用過的排最後；紀錄中存在但未成功回填進選項庫的歷史值也會補入，
  已封存的名稱則維持隱藏——推薦與清單順序都吃這個排序，不需要額外的 DB 欄位（紀錄本來就
  整批載入前端）。
  - `PeopleSelect`：通用多選欄位，「地點」「和誰」跟「標籤」都用它（合併後地點也是多選
    `locations` text[]，`LocationSelect` 單值元件已隨 `EventForm` 一起移除）。已選的顯示成
    tag chips（primarySoft 底、可 × 移除），輸入框 Enter/「加入」/點推薦加入新值；「清單」的
    `<select>`（「＋ 選擇加入…」）列出未選的全部選項。`history` 項目可以是字串或
    `{ value, label }`——事件標籤用後者，子標籤 label 帶「└ 」縮排、選了存的是純名字。
    表單 state 直接就是陣列。推薦 chip 用 `onMouseDown preventDefault` 避免先觸發輸入框 blur。
- **`Settings.jsx`** — 設定頁，從 header ⚙ 按鈕進入。最上面是帳號卡片：顯示目前登入的
  email（LINE 登入的帳號是 `line-<sub>@line.invalid` 這種假 email，會轉成
  `LINE: U1234...wxyz` 遮罩顯示，邏輯跟 calorie-tracker/recipe-book 的 `Auth.jsx`/
  `SettingsTab.jsx` 一致）+ `NicknameEditor`（內部元件：輸入框+儲存，讀寫
  `db.js` 的 `loadMyDisplayName`/`updateDisplayName`，也就是跨 app 共用的
  `shared.user_profiles.display_name`——在這裡改暱稱，calorie-tracker、recipe-book
  的設定頁會立刻看到同一個名字，反過來也一樣）+ `LineLinker`（內部元件，見下）；
  下面是「管理日記分類與標籤」一列（點下去切到 `ManageTags.jsx`）、「管理地點、
  人名與事件標籤」一列（切到 `ManageOptions.jsx`）和**「登出」一列**
  （紅字置中，登出按鈕從主畫面 header 移過來的，跟 calorie-tracker/recipe-book 的
  設定頁一致），之後有新設定項目直接加在清單裡。
  **`LineLinker`** 的連結狀態邏輯（跟其他兩個 app 共用同一套設計）：`checkLineLinked()`
  查到 `true` 就寫進 `localStorage`（key `calendar:line-linked`），下次開 app 先用快取
  顯示「已連結」，查詢還沒回來或暫時失敗（回傳 `null`）都不會覆蓋掉快取，避免畫面
  閃一下「未連結」又跳回「已連結」；「連結 LINE 帳號」按鈕只有 `canLinkLine()` 為
  true（在 LINE App 裡開啟且 LIFF 已登入）才會顯示，一般瀏覽器打開看不到這顆按鈕。
- **`ManageTags.jsx`** — 管理分類與標籤，**三層結構：分類 → 主標籤 → 子標籤**
  （2026-07-09 改版，版型參考外部 mockup、配色沿用 THEME）。分類卡片頂列：▲▼ 調整
  分類順序（`useDiaryTags.moveCategory`，跟相鄰分類互換 `sort_order`，邊界 disable）、
  點名稱行內改名（`InlineName` 內部元件：span ↔ 底線 input，Enter/失焦送出、Esc 取消，
  分類/主標籤/子標籤三層共用）、▾/▸ 收合整個分類、刪除分類（兩段確認，連動清掉既有
  日記裡用到的主/子標籤，見 `useDiaryTags.deleteCategory`）。每個主標籤一列（`TagBox`
  內部元件）：▲▼ 排序（`moveTagInCategory`，直接在 `tags` 陣列裡交換位置，順序就是
  陣列順序）、點名字改名、子標籤數 badge、▾/▸ 展開子標籤區、× 刪除。展開後子標籤是
  圓角 chip：‹ › 左右排序（`moveSubTag`）、點名字改名（`renameSubTag`）、× 刪除
  （`removeSubTag`）、虛線「+ 新增」pill 點開變輸入框（`addSubTag`）；主標籤同樣用
  虛線「+ 新增主標籤」pill 新增。全程沒有拖曳——mockup 用 HTML5 drag，但在手機版
  LINE LIFF webview 裡觸控拖曳不可靠，一律用按鈕。
  **標籤名稱全域唯一（含子標籤）**：改名/新增前都用 `useDiaryTags.findTagOwner()` 檢查，
  撞名就顯示錯誤提示不送出。特例：在某分類新增一個「別的分類已在用的**主標籤**」名稱
  時，彈出「要移到 Z 嗎？」確認卡片，確認後 `moveTagToCategory` 整個標籤物件（連同
  子標籤）搬過去（不影響既有日記的 `tags`，存的是名字字串，換分類不會變）；撞到的
  是**子標籤**則直接擋下提示。
  **主標籤/子標籤改名會同步改寫舊紀錄**：`useDiaryTags.js` 的 `renameTagInCategory`/
  `renameSubTag` 呼叫 `recordSync.renameTag()`（實作是 `useRecords.renameDiaryTagEverywhere`）——
  紀錄 `diary_tags` 陣列裡的字串、`tag_details` 的 key 一起換成新名字，避免孤兒標籤；
  前端 `Promise.all` 迴圈更新，不是資料庫層級的 cascade。
- **`ManageOptions.jsx`** — 管理地點、人名與事件標籤（設定頁的另一個子頁，管的是
  `event_options` 選項庫，跟 `ManageTags.jsx` 管的日記分類是兩套獨立機制）。三個
  區塊：地點、和誰（人名）、事件標籤（每個標籤卡片內含子標籤列表 + 新增子標籤輸入列）。
  每一列（`OptionRow` 內部元件）：**點名字直接改**（Enter/失焦送出；改名先走
  `useOptions.renameOption()`——同層撞名自動合併——再用 `useRecords.renameFieldValue()`
  同步改寫過去引用的紀錄（`locations`/`people`/`tags`），跟 `renameTagInCategory` 同一套
  「前端 Promise.all 迴圈、不是 DB cascade」的做法）、**使用次數**（前端從已載入的
  紀錄算的：地點/人名/選項庫標籤各自計數）、**封存/恢復**（封存只影響之後的
  選單，過去紀錄照舊）、**永久刪除 🗑**（只有使用 0 次、而且標籤底下沒有子標籤時才
  出現，按了還有 `window.confirm` 確認）。每個區塊底部有虛線的「＋ 新增，按 Enter」
  輸入列；新增撞到已封存的同名項目時直接幫它恢復（不會建重複的）。選項庫載入失敗
  （例如 migration 還沒跑）時頁面頂端顯示錯誤提示，其他功能不受影響。
- **`TasksView.jsx`** — 任務列表，依到期日排序，狀態文字依 `diffDays` 顯示「已逾期 N 天」
  （紅）/「今天到期」（主色）/「N 天後到期」（灰）。每筆有「標記完成」（點開會出現日期
  選擇器，預設今天，確認後呼叫 `onConfirmComplete`）、「歷史紀錄 (N)」（有完成過才顯示，
  展開列出過去完成日期）、「刪除」（兩段確認）。`show_on_calendar=false` 的任務會標註
  「不會顯示在行事曆」。
- **`TaskForm.jsx`** — 新增/編輯任務：標題、重複間隔（數字 + 天/週/個月 三段式選擇器）、
  到期日（新增時欄位標籤是「起始到期日」，編輯時是「下次到期日」，因為編輯已存在的任務
  時這個欄位代表的意義變了）、「顯示在行事曆」開關。**這個表單本身沒有刪除按鈕**——
  刪除任務的操作在 `TasksView.jsx` 的列表項目上，不在編輯表單裡（跟 `RecordForm`
  的刪除放在表單內不一樣，因為設計稿就是這樣分的，任務的刪除更像列表操作而非編輯操作）。
- **`Auth.jsx`** — 登入介面：Email + 密碼登入、註冊、忘記密碼，跟其他 app 風格一致。

---

## 為什麼「新增紀錄」只能從日檢視發起，「標記完成任務」只能在任務檢視發起

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

四張表，都在 `calendar` schema（`diary_entries` 2026-07-15 已併入 `events`，見下）：

### `events`（＝合併後的「紀錄」。完整 SQL 見 `supabase/schema.sql` + `2026-07-02_event_color_tags.sql`
+ `2026-07-04_event_location.sql` + `2026-07-08_event_people.sql` + **`2026-07-15_merge_diary_into_events.sql`**）

一筆紀錄同時裝計畫面與回顧面的欄位，多半可空——有填才顯示（見 `TimelineItems`）。

| 欄位 | 型別 | 用途 |
|---|---|---|
| `id` | bigint (PK, identity) | 主鍵 |
| `user_id` | uuid → `auth.users(id)` | 擁有者（CASCADE） |
| `title` | text | 標題（**合併後可空**，純日記可以沒有標題） |
| `description` | text | 計畫備註（選填） |
| `note` | text | 回顧：今天的感覺（選填，跟 `description` 並存，兩者語意不同故不合併） |
| `start_at` | timestamptz | 開始時間（日記併入時以 Asia/Taipei 把 `entry_date`+`time` 換算成此欄） |
| `end_at` | timestamptz | 結束時間（選填） |
| `all_day` | boolean | 是否全天 |
| `color` | text | 顏色（`EVENT_COLORS` 其中一個 hex，選填；月檢視圓點用它，沒設退回 `primaryDark`） |
| `locations` | text[] | 地點，可多個（合併時把舊 `events.location` 單值併進來；顯示各帶一個 📍） |
| `people` | text[] | 同伴（選填，顯示帶 👤） |
| `tags` | text[] | **選項庫標籤**（「這是什麼」，存純名字；選單與母/子階層由 `event_options` 管理） |
| `diary_tags` | text[] | **分類標籤**（「感受」，存純名字；字彙由 `tag_categories` 管理，見 `useDiaryTags`） |
| `tag_details` | jsonb | `diary_tags` → 細節文字的 map，例如 `{"追劇":"想見你 EP5"}`。只有真的填了才有 key（`RecordForm` 存檔前清掉沒填/已取消選取的殘留 key） |
| `hashtags` | text[] | ＃快速注記：自由短句（例如「今天吃好多」），跟結構化標籤分開存、不進選項庫。存純文字不含「＃」，顯示時才加 |
| `created_at` | timestamptz | 建立時間 |

> **舊 `location`（單值）欄位**：合併 migration 把值搬進 `locations` 後，`location` 欄位先留著
> 不動（drop 語句在 migration 尾端註解，確認新版穩定後再手動收尾）。程式碼已不再讀它。

### `diary_entries`（**已淘汰**，2026-07-15 併入 `events`）

日記原本是獨立一張表（`entry_date` + `time`/`end_time` 純字串、`tags`/`tag_details`/`title`/
`note`/`hashtags`/`locations`）。合併時整批 `insert into events`（時間以 Asia/Taipei 換算成
`start_at`、原 `tags` 搬進 `diary_tags`）。migration 尾端把這張表**改名備份成
`diary_entries_bak`**（不直接 drop），確認新流程無誤後再手動刪。

### `tag_categories`（完整 SQL 見 `supabase/2026-07-02_diary.sql` + `2026-07-05_category_sort_order.sql` + `2026-07-09_tag_subtags.sql`）

| 欄位 | 型別 | 用途 |
|---|---|---|
| `id` | bigint (PK, identity) | 主鍵 |
| `user_id` | uuid → `auth.users(id)` | 擁有者（CASCADE），每人的分類/標籤互不相通 |
| `name` | text | 分類名稱（工作/社交/心情/健康…） |
| `tags` | jsonb | 這個分類底下的標籤，**不是獨立一張表**，直接存陣列。2026-07-09 起從 `text[]`
  改成 `[{ "name": "運動", "subs": ["跑步"] }]` 支援子標籤；migration 會把舊字串
  元素自動包成物件（可重跑），也會修復 migration 沒跑期間 app 寫進 `text[]` 被
  PostgREST 壓成 JSON 字串的元素（解析回物件），前端 `useDiaryTags.normalizeCategories()` 另外兜底 |
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

### `event_options`（完整 SQL 見 `supabase/2026-07-09_event_options.sql`）

地點/人名/事件標籤的選項庫：表單下拉選單與設定頁「管理地點、人名與事件標籤」的資料來源。
事件與日記的地點/人名共用同一池。migration 會把既有事件/日記用過的值回填進來。

| 欄位 | 型別 | 用途 |
|---|---|---|
| `id` | bigint (PK, identity) | 主鍵 |
| `user_id` | uuid → `auth.users(id)` | 擁有者（CASCADE） |
| `kind` | text | `location` / `person` / `tag`（check constraint） |
| `name` | text | 顯示名稱；**事件/日記存的還是純文字，不是這裡的 id**——選項庫只管選單跟維護，改名時由前端同步改寫過去的紀錄 |
| `parent_id` | bigint → `event_options(id)` | 子標籤指向母標籤（CASCADE，只有 `kind='tag'` 會用到，一層） |
| `archived` | boolean | 封存：選單不再出現，但過去紀錄照舊保留 |
| `created_at` | timestamptz | 建立時間（選單排序依這個） |

同層同名有唯一索引（`user_id, kind, name, coalesce(parent_id, 0)`），
`ManageOptions.jsx` 改名撞到同名時走 `useOptions.renameOption()` 的自動合併。

**設計重點：**
- **RLS 全開，沒有分享機制** — 五張表的 policy 都是 `auth.uid() = user_id`
  （select/insert/update/delete 都一樣），純個人行程，不像 recipe-book 有 `is_shared`
  這種公開機制。以後如果要加「共享行事曆」，這幾張表都要新增 `is_shared` 或另開對照表，
  不要直接改 `user_id` 的語意。
- **任務的下次到期日運算是前端算好才寫回 DB，不是資料庫 trigger** — `useTasks.js` 的
  `confirmComplete()` 呼叫 `utils.addInterval(doneDate, intervalValue, intervalUnit)`
  算出 `next_due`，直接連同 `last_done`、`history` 一起 update。如果之後要在其他地方
  （例如伺服器端排程）也需要算這個邏輯，記得 `addInterval` 的邏輯要一併搬過去，不要
  假設資料庫會自動處理。
- **標籤沒有正規化成獨立表** — `tag_categories.tags` 直接存文字陣列，紀錄的 `diary_tags`
  也是文字陣列存標籤字串本身（不是外鍵 ID）。優點是 CRUD 簡單；代價是「改標籤名稱」等於
  「這個標籤在所有地方都變成新字串」——所以改名/刪除時 `useDiaryTags` 透過 `recordSync`
  一併更新所有引用該標籤的紀錄 `diary_tags`（`renameDiaryTagEverywhere` 前端 Promise.all
  迴圈），不是只改 `tag_categories.tags`。
- **標籤名稱在同一使用者底下全域唯一，不是只在單一分類內唯一** — 沒有資料庫層級的
  唯一約束，是 `ManageTags.jsx`/`RecordForm` 在新增時前端擋掉（`findTagOwner`）；
  這樣設計是因為紀錄的 `diary_tags` 存的是標籤字串本身、不帶分類資訊，如果同一個
  字串在兩個分類都存在，`categoryAccentForTag`（`theme.js`）沒辦法判斷這個標籤該用
  哪個分類的強調色，卡片上的顏色會不穩定。
- **時間一律存 `timestamptz`（UTC）**，前端用瀏覽器/裝置的本地時區顯示，靠
  `toDatetimeLocalValue`/`fromDatetimeLocalValue`（`utils.js`）轉換，沒有額外的時區欄位。
  合併前日記另存 `entry_date`/`time` 字串，已在 2026-07-15 migration 以 Asia/Taipei 換算併入 `start_at`。
- **全天紀錄的 `start_at`** 存的是「選定日期的本地午夜」轉成的 UTC 時間戳，`all_day=true`
  時 UI 不顯示時間。
- **一次載入使用者所有資料**（`loadRecords`/`loadCategories` 都沒有分頁或日期範圍過濾）——
  刻意的簡化決定，個人行事曆資料量小，不值得為 v1 加分頁複雜度。
  如果之後資料量大到影響效能，再改成依月份/週範圍查詢。
- **新使用者的預設分類是應用層邏輯，不是資料庫 trigger** — `useDiaryTags.js` 載入完
  `tag_categories` 後如果是空的才會呼叫 `createCategories` 種預設值，只會發生一次
  （種完之後 `tag_categories` 就不是空的了）。
- **所有「Enter 送出」的文字輸入框都要先擋 IME 組字** — `onKeyDown` 開頭一律
  `if (e.nativeEvent.isComposing) return;`。中文輸入法選字按 Enter 確認時 `keydown`
  也會觸發，不擋的話打到一半的字（例如只打了姓氏）就會被直接送出。目前套用在
  `HistoryFields.jsx`、`RecordForm.jsx`、`ManageOptions.jsx`、`ManageTags.jsx`；
  之後新增這類輸入框也要照做。

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
| `2026-07-06_diary_tag_details.sql` | `diary_entries` 加 `tag_details` jsonb 欄位（標籤細節，例如追劇填劇名） |
| `2026-07-08_event_people.sql` | `events` 加 `people` text[] 欄位（事件同伴，跟日記的 `people` 同慣例） |
| `2026-07-09_event_options.sql` | 建 `event_options` 表 + RLS（地點/人名/事件標籤選項庫），並回填既有事件/日記用過的值 |
| `2026-07-09_tag_subtags.sql` | `tag_categories.tags` 由字串陣列改成 `{name, subs}` 物件陣列（含壞資料修復） |
| `2026-07-10_diary_locations_array.sql` | `diary_entries.location`（text）改名 `locations` 並轉 `text[]`（日記地點可多個），既有值轉單元素陣列 |
| `2026-07-10_diary_hashtags.sql` | `diary_entries` 加 `hashtags text[]` 欄位（＃快速注記） |
| `2026-07-10_diary_title.sql` | `diary_entries` 加 `title text` 欄位（日記標題，配合新版當日排版） |
| **`2026-07-15_merge_diary_into_events.sql`** | **事件與日記合併**：`events` 加 `note`/`locations`/`diary_tags`/`tag_details`/`hashtags`、`title` 放寬可空、舊 `location` 併進 `locations`；把 `diary_entries` 整批以 Asia/Taipei 換算時間 `insert into events`；尾端（註解、需手動）把 `diary_entries` 改名成 `diary_entries_bak`、drop 舊 `location` 欄位 |

> 新環境依序跑上表（`schema.sql` 起、按日期）到 `2026-07-15_merge_diary_into_events.sql`。
> `2026-07-02_diary.sql` 之後那串 `diary_*` migration 仍要照跑（合併 migration 假設
> `diary_entries` 已是最終欄位結構才做搬移）。之後有新欄位/新表再依日期新增檔案，格式跟
> 其他 app 一致：`YYYY-MM-DD_描述.sql`。

---

## LINE 整合

跟 calorie-tracker / recipe-book **完全相同**的實作：
- 前端 `src/liff.js` 是 `@peggy-life/shared/lineAuth` 的薄殼（邏輯只有一份）
- `api/` 底下的 `_lineVerify.js`/`_lineLogin.js`/`_lineLink.js`/`_lineLinkStatus.js`/
  `line-login.js`/`line-link.js`/`line-link-status.js` 三個 app **逐字相同**（Vercel
  serverless 必須每個 app 各放一份，改任何一份要同步另外兩份），唯一不同的檔案是
  `_supabaseAdmin.js`——`getSupabaseAdmin()` 指向本 app 自己的 `calendar` schema，
  `getSupabaseAdminForLine()` 指向共用的 `shared` schema（`line_links` 表實際所在的地方，
  見上方「跨 app 共用 LINE 登入」）
- `_lineLogin.js` 首次 LINE 登入會把 LINE 顯示名稱 seed 進 `shared.user_profiles`
  （僅暱稱空白時），本 app 的暱稱顯示（`Settings.jsx`）讀同一張表，直接受惠

`api/` 底下跟 LINE 有關的檔案：`_lineLogin.js`/`line-login.js`（LIFF 自動登入）、
`_lineLink.js`/`line-link.js`（把目前登入的帳號綁定到這個 LINE 身份）、
`_lineLinkStatus.js`/`line-link-status.js`（查詢目前帳號是否已綁定，給 `Settings.jsx`
的 `LineLinker` 顯示「已連結」狀態用）、`_lineVerify.js`（驗證 LINE ID token）、
`_supabaseAdmin.js`（`getSupabaseAdmin()`/`getSupabaseAdminForLine()` 兩個 admin
client 工廠）。

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
