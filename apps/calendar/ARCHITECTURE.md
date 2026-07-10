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
Supabase ⇄ db.js ⇄ useEvents.js / useDiary.js / useTasks.js / useOptions.js ⇄ Root.jsx / App.jsx ⇄ components/*
          (純 API)  (狀態+動作，四個獨立 hook)                                (登入閘口 / 協調)     (畫面)
```

- 元件**不會**直接呼叫 `db.js`。事件走 `useEvents()`；日記與標籤分類走 `useDiary()`；
  週期性任務走 `useTasks()`；地點/人名/事件標籤選項庫走 `useOptions()`。
  四個 hook 平行存在，`App.jsx` 同時使用並互相傳遞需要的資料
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
| **時間軸列的共用渲染（事件/日記/任務列、日記標籤 chip、地點/同伴小字）** | `src/components/TimelineItems.jsx` |
| **新增/編輯事件表單（標題、顏色、標籤、標題建議、全天、時間、地點、和誰、備註、刪除）** | `src/components/EventForm.jsx` |
| **新增/編輯日記表單（分類標籤選擇、時間、地點、和誰在一起、心情筆記）** | `src/components/DiaryForm.jsx` |
| **時間選擇（預設 30 分鐘一格下拉選單，可切換手動輸入）** | `src/components/TimeSelect.jsx` |
| **地點/和誰的歷史選單輸入（下拉選歷史值，可切自行輸入，人名顯示成 tag chips）** | `src/components/HistoryFields.jsx` |
| **設定頁（帳號/暱稱/LINE 連結、管理標籤入口、登出）** | `src/components/Settings.jsx` |
| **管理日記分類與標籤（三層：分類→主標籤→子標籤；改名/刪除/排序/收合）** | `src/components/ManageTags.jsx` |
| **管理地點、人名與事件標籤（改名同步、封存、刪除、子標籤）** | `src/components/ManageOptions.jsx` |
| **任務列表（狀態顯示、標記完成、歷史紀錄、刪除）** | `src/components/TasksView.jsx` |
| **新增/編輯任務表單（標題、重複間隔、到期日、是否顯示在行事曆）** | `src/components/TaskForm.jsx` |
| **日期運算、事件/日記分組、時間軸合併、任務間隔運算** | `src/utils.js` |
| **Supabase 查詢（events / diary_entries / tag_categories / tasks / event_options 的 CRUD）** | `src/db.js` |
| **Supabase client 連線** | `src/supabase.js`（re-export `@peggy-life/shared`） |
| **LINE LIFF 初始化與登入** | `src/liff.js` |
| **Email/密碼與 LINE 自動登入閘口** | `src/Root.jsx` |
| **Email 登入/註冊/重設密碼頁面** | `src/components/Auth.jsx` |
| **事件狀態中樞（事件清單、檢視模式、月/週/日/任務翻頁與選中日）** | `src/useEvents.js` |
| **日記狀態中樞（日記清單、分類標籤、預設分類種子）** | `src/useDiary.js` |
| **任務狀態中樞（任務清單、標記完成與下次到期日運算）** | `src/useTasks.js` |
| **選項庫狀態中樞（地點/人名/事件標籤選單、改名合併、封存）** | `src/useOptions.js` |
| **主外殼、overlay state（單一物件管理所有覆蓋畫面）** | `src/App.jsx` |

---

## 每個檔案在幹嘛

### 核心
- **`src/main.jsx`** — 進入點，呼叫 `initLiff()` 完成後掛載 `<Root/>`。
- **`src/Root.jsx`** — 檢查 `.env` → 執行 LINE 自動登入 / Email 登入驗證 → 已登入則載入 `<App/>`。
- **`src/App.jsx`** — 520px 置中外殼，同時載入 `useEvents()` + `useDiary()` + `useTasks()`。
  所有覆蓋畫面（事件/日記/任務表單、設定、管理標籤）用**單一 `overlay` state 物件**管理
  （`null | { type: 'event'|'diary'|'task', mode, ... } | { type: 'settings' } |
  { type: 'manageTags' }`），`renderOverlay()` 依 type switch——之前是五個獨立 boolean/
  物件 state 疊三元運算子鏈，每加一個畫面就更難讀，改掉了；之後要加新覆蓋畫面就加一個
  type。header 只剩標題 + ⚙ 齒輪按鈕（開設定頁），登出按鈕移到設定頁裡（跟
  calorie-tracker/recipe-book 一致，手機上省一顆常駐按鈕）。地點/人名/事件標籤的
  選單資料來自 `useOptions()` 的 `menus`，傳給 EventForm/DiaryForm；事件/日記存檔後
  呼叫 `opts.ensureNames()` 把新出現的名字自動補進選項庫。
- **`src/useEvents.js`** — ⭐ **事件狀態中樞**。載入事件、`eventsByDate`（依日期分組）、
  `view`（月/週/日/任務，**預設 `'day'`**——開 app 直接看「今天要幹嘛」，不是先看整個
  月曆）、`anchorKey`（目前翻頁翻到哪個月/週/天）、`selectedDateKey`
  （月檢視裡選中的單一天，跟 `anchorKey` 分開存，翻月曆不會弄丟選中的日期）、
  `openDay(dateKey)`（月/週檢視點下去統一走這條：對齊 anchor + selected + 切到日檢視）、
  新增/編輯/刪除 action。
- **`src/useDiary.js`** — ⭐ **日記狀態中樞**。載入日記與分類、`entriesByDate`（依日期分組）、
  日記 CRUD、分類/標籤管理（新增分類、改名、刪除、新增/刪除/改名/排序主標籤與子標籤——
  `addSubTag`/`renameSubTag`/`removeSubTag`/`moveSubTag`）、`tagDetailHistory`
  （`Map<tag, string[]>`，把所有日記裡每個標籤填過的細節文字去重、依日期新到舊排序，
  給 `DiaryForm.jsx` 的細節輸入框當 `<datalist>` 建議選項用）。**新使用者第一次使用時
  如果分類是空的，會自動種一組預設分類**（工作/社交/心情/健康）方便直接上手，之後不會再種。
  `tags` 的形狀是 `[{ name, subs: [] }]`（2026-07-09 起 jsonb，見下方 `tag_categories`）；
  載入時 `normalizeCategories()` 會把 migration 前的純字串陣列包成新格式（讀不會壞，
  但寫入需要先跑 migration）。`findTagOwner(categories, name)`（具名 export）是
  「標籤名稱全域唯一（含子標籤）」檢查的單一入口，`ManageTags.jsx` 也用它。
- **`src/useTasks.js`** — ⭐ **任務狀態中樞**。載入任務、`tasksByDueDate`（依到期日分組，
  只有 `show_on_calendar=true` 的才會進這個分組，給月/週/日檢視顯示用）、任務 CRUD、
  `confirmComplete(taskId, doneDate)`（標記完成：用 `utils.addInterval()` 算出下次到期日、
  把完成日期推進 `history` 陣列）。
- **`src/useOptions.js`** — ⭐ **選項庫狀態中樞**（地點/人名/事件標籤，`event_options` 表）。
  `menus`（表單下拉選單資料：未封存的地點/人名字串陣列 + 標籤 `{ value, label }` 陣列，
  子標籤縮排、母標籤封存整組不出現）、`ensureNames()`（事件/日記存檔後把新名字自動補進
  選項庫，失敗只警告不擋存檔）、`addOption`/`setArchived`/`removeOption`、
  `renameOption()`（同層同名自動合併：子標籤搬到目標下、同名子標籤消掉；回傳
  `{ kind, oldName, newName }` 讓 `ManageOptions.jsx` 同步改寫過去的事件/日記）。
  **跟其他 hook 不同：載入失敗不擋整個 app**——選單退化成純文字輸入，`loadError`
  只在設定頁的維護頁顯示（例如 migration 還沒跑）。
- **`src/db.js`** — Supabase 的純查詢函式：events（`loadEvents`/`createEvent`/…）、
  diary_entries（`loadDiaryEntries`/`createDiaryEntry`/…）、tag_categories
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
  （`getMonthDays`）、週的 7 天（`getWeekDays`）、事件/日記分組（`groupEventsByDate`/
  `groupDiaryByDate`）、`buildDayTimeline(events, diaryEntries, tasksDueToday)`（把某天的
  事件+日記+到期任務合併成一條依時間排序的時間軸，Month/Week/Day 三個檢視共用同一個函式，
  行為才會一致）、`addInterval(dateKey, value, unit)` / `diffDays(a, b)`（任務的到期日運算）、
  `<input type="datetime-local">` 字串轉換。

### 畫面（`src/components/`）
- **`ViewTabs.jsx`** — 月/週/日/任務四個 tab + 「今天」按鈕（`view==='tasks'` 時不顯示，
  任務列表沒有「翻頁到某一天」的概念）。
- **文字日記的「紙張卡」呈現** — 日記分兩種視覺：**沒寫**「今天的感覺」的（純標籤
  打卡）維持原本的緊湊 chip 列；**有寫**的（`entry.note` 非空）改用暖色紙感卡片——
  置中「✦ 時間 ✦」小字、內文用襯線字體（`DIARY_SERIF`，`index.html` 載入
  Noto Serif TC）、行高拉大，標籤氣泡 chip（`DiaryTags onTint`，白底）與 📍👤 小字
  收進底部虛線腳註。配色是 `theme.js` 的 `paper*` 系列（刻意跳出柔和藍主題，讓有
  內容的日記一眼被認出來）。DayView 是完整版（全文、`whiteSpace: pre-wrap`），
  Week/Month（`TimelineItems`）是緊湊版（文字 `-webkit-line-clamp` 截 2 行）。
  判斷純看有沒有 note，不加欄位、表單不用選。
- **`TimelineItems.jsx`** — ⭐ **時間軸列的共用渲染**。之前 Week/Month 各自複製一份
  「事件列/日記列/任務列」的渲染邏輯（dot、固定寬度時間欄、`metaLine` 地點/同伴小字、
  `DiaryTags` 標籤 chip、全天項目不顯示時間欄……），連續好幾個需求都要三個檢視改三遍，
  所以抽出來：Week 的每日清單、Month 的選中日摘要卡都直接用 `<TimelineItems>`，DayView
  版型不同（大卡片、有筆記）只共用 `metaLine()` 和 `DiaryTags`。歷來的顯示規則都集中在
  這裡：時間欄固定 `width: 78` + `nowrap`（用 `minWidth` 會被長時間區間撐開導致各列
  chip 起始位置不齊）、全天事件只留彩色 dot 不顯示時間欄、全天日記連 dot 都不顯示、
  `meta(indent)` 依列型態縮排（計時列 102 / 全天事件 16 / 全天日記 0）、**日記標籤
  最多一個時地點/同伴小字直接接在標籤 chip 旁同一行**（兩個以上標籤才另起一行，
  DayView 的日記卡片也套同一條規則——單行資訊少時不用多佔一行）。
  `onEventClick`/`onDiaryClick`/`onTaskClick` 是選填 prop：有傳項目才可點（Month 摘要卡
  用，直接開編輯），沒傳就純顯示（Week 用，整個日列本身已經可點）。
- **`MonthView.jsx`** — 格線月曆，日期下方顯示事件顏色圓點（最多 3 個不同色）+ 日記圓點
  （固定用 `theme.primaryDark`）+ 任務小方點（`theme.textMuted`），圖例列說明三種點
  代表什麼。點日期只會「選中」（`onSelectDay`），不離開月檢視；下方的「選中日摘要卡」
  用 `<TimelineItems>` 顯示該天的合併時間軸，**摘要卡裡的項目可以直接點**——事件/日記
  點了直接開對應的編輯表單、任務點了跳任務檢視（`onEditEvent`/`onEditDiary`/
  `onGoToTasks`，`App.jsx` 傳入），不用先繞去日檢視再點一次；點摘要卡標題列才是
  `onOpenDay` 跳日檢視。
- **`WeekView.jsx`** — 一週 7 天直向列表，每天用 `<TimelineItems>` 顯示事件+日記+到期
  任務合併時間軸（純顯示、不傳 click handler），點某一天呼叫 `onOpenDay` 跳去日檢視。
- **`DayView.jsx`** — 單日事件+日記+任務合併時間軸（`buildDayTimeline`），事件卡片顯示
  顏色點/時間/標題/地點/同伴/描述/標籤，日記卡片顯示時間/標籤（依分類上色）/地點/同伴/心情筆記，
  任務卡片顯示虛線邊框+核取方塊圖示（點擊呼叫 `onGoToTasks` 切到任務檢視，不能直接在
  這裡標記完成——完成流程需要選日期，統一在任務檢視操作），可切換前一天/後一天，底部
  並排「＋ 新增事件」「＋ 新增日記」兩個按鈕（新增動作只從日檢視發起，月/週檢視只負責
  導覽——見下方原因說明）。**全天事件/日記是獨立的卡片樣式**（`allDayCard`），不是
  塞進時間欄那格文字寫「全天」——沒有時間欄，事件是 dot + 標題起頭，**日記連 dot 都
  拿掉**（日記的 dot 本來就是固定色、沒有像事件顏色那樣攜帶資訊，使用者反饋看起來
  像個多餘的黑點，拿掉後 `allDayDiaryMeta`/`allDayDiaryNote` 的縮排也跟著從 18 改成 0，
  貼齊標籤 chip 起始位置），背景換成 `THEME.primarySoft` 跟計時項目的卡片區分開來，
  日記標籤 chip 背景也跟著換成 `THEME.surface`（不然會被同色系的卡片背景吃掉）。
  這是使用者實際看畫面反饋的：「全天」文字塞在時間欄裡看起來很生硬，拆成獨立卡片
  樣式比較自然；Week/Month 也套用同一套「不顯示全天欄位」的邏輯保持一致（見上）。
- **`EventForm.jsx`** — 新增/編輯事件表單：標題（新增模式下輸入時會列出過去用過的相同
  標題建議，點擊帶入標題+顏色）、7 色顏色選擇器、標籤（`PeopleSelect` 多選：選單列出
  選項庫的母/子標籤，也可自行輸入）、
  全天開關（切換是否顯示時間欄位）、開始/結束時間（日期 `<input type="date">` +
  `TimeSelect`）、地點/和誰（`HistoryFields.jsx` 的歷史選單元件，見下，跟 DiaryForm
  同一套）、描述、刪除（兩段確認的置中文字連結）。**動作列跟 DiaryForm 統一**：
  「儲存」固定在頂部 header 右側（表單再長都不用滑到底才能存），返回鍵在左上；
  原本底部的儲存/取消直排按鈕已移除。**未儲存變更防呆**：mount 時記一份欄位 JSON
  快照，按返回時跟目前值比對，有差異先跳 `window.confirm('內容還沒儲存，確定要離開嗎？')`，
  避免手滑丟失輸入（DiaryForm 同一套做法）。
- **`DiaryForm.jsx`** — 新增/編輯單筆日記：頂部已選標籤即時預覽（純顯示用的 chip，
  不含輸入框）、全天切換、時間/結束時間（`TimeSelect`）、地點/和誰在一起
  （`HistoryFields.jsx`，見下；**日記地點可多個**，跟「和誰」一樣用 `PeopleSelect`
  多選 chip，存 `locations` text[]；事件的地點維持單值 `LocationSelect`）、
  心情筆記、依分類分組的標籤選擇卡片
  （`CategoryTagCard` 內部元件，點擊 toggle 選取狀態，放在表單最下面）、刪除
  （兩段確認）。**不含**「管理分類與標籤」入口——那個入口移到設定頁了（見下）。
  **欄位順序維持原本的「全天→時間→地點→同伴→筆記→標籤」**：曾經試過把標籤卡片
  搬到最上面（選標籤是核心動作），但實際用起來反而不順手（可能是因為表單一開
  就要先做選擇、不能循序漸進），改回標籤在最下面。**未儲存變更防呆**跟
  `EventForm.jsx` 同一套：按返回時有未儲存的改動會先 `window.confirm` 確認。
  **標籤細節（`tag_details`）輸入框在 `CategoryTagCard` 裡、緊貼在該標籤所屬的
  分類卡片底下**（不是頂部預覽區）：分類卡片的標籤 chip 列表下方，如果這個分類裡
  有標籤被選中，會列出「標籤名稱 + 細節輸入框」一行（`detailList`/`detailRow`），
  只顯示屬於這個分類、而且目前有選中的標籤，不會把其他分類的細節混進來。取消
  選取標籤時會順便清掉對應的細節，不留孤兒 key。輸入框有 `list` 屬性接一個原生
  `<datalist>`，選項是 `useDiary.js` 算出的 `tagDetailHistory`——同一個標籤過去
  填過的細節文字，點輸入框瀏覽器會跳原生下拉建議，不用重新打一次同樣的劇名。
  `CategoryTagCard` 右上角有一顆小小的「＋」圓形按鈕（不是文字按鈕，因為
  寫日記的分類卡片已經很多資訊，字太大反而搶戲）：點下去在卡片底部展開輸入框，
  Enter/按鈕送出。輸入的名字如果在別的分類已經存在，不會建立重複標籤——跟
  `ManageTags.jsx` 的處理方式不一樣：`ManageTags.jsx` 是彈出確認卡片問要不要把標籤
  「移到」這個分類；這裡因為只是要選一個標籤來標記日記，不是在管理分類結構，所以
  直接把那個既有標籤選起來（不建立重複、也不搬動分類），順便顯示一行提示
  「「X」已經在「Y」分類，直接幫你選起來了」。
- **`TimeSelect.jsx`** — 時間選擇元件，`EventForm.jsx`/`DiaryForm.jsx` 共用：預設是
  0:00～23:30、每 30 分鐘一格的 `<select>`（原生 `<input type="time" step="1800">` 在
  多數瀏覽器裡點按鈕還是以 1 分鐘為單位滾動，`step` 屬性對 UI 不生效，所以改用真正的
  下拉選單）；選單最後一項「自訂時間…」會切換成原生 `<input type="time">`，可以輸入
  任意分鐘，切回去按「整點/半點」；如果傳入的 `value` 本來就不是 30 分鐘的倍數（例如
  舊資料或手動輸入過），下拉選單會自動多出一個「HH:MM（自訂）」的選項顯示目前值，
  不會憑空把值改掉。
- **`HistoryFields.jsx`** — 地點/和誰/事件標籤的輸入元件，`EventForm.jsx`/
  `DiaryForm.jsx` 共用。**預設是文字輸入框**：打字時下方即時列出包含相同字的歷史
  選項（dashed 圓 chip，最多 5 筆，點一下帶入）；想瀏覽全部才按「清單」切換成
  `<select>`（選完或失焦就回到輸入框）。選項資料來自 `useOptions()` 的 `menus`
  （`event_options` 選項庫裡未封存的項目，事件與日記共用同一池），但地點/人名
  傳進表單前會先經過 `App.jsx` 的 `recentMenus`（useMemo）**依「最近一次使用」重排**：
  從事件（`start_at`）＋日記（`entry_date`+`time`）算每個名字最近出現的時間，越近
  越前面、沒用過的排最後——推薦與清單順序都吃這個排序，不需要額外的 DB 欄位或
  使用次數記錄（事件/日記本來就整批載入前端）。
  - `LocationSelect`（單值）：輸入框＋推薦；「清單」的 `<select>` 列「（不填）+
    全部地點」。只剩 `EventForm.jsx` 在用——日記的地點已改多選（`locations` text[]），
    用下面的 `PeopleSelect`。
  - `PeopleSelect`：通用多選欄位，「和誰」跟事件「標籤」都用它。已選的顯示成 tag
    chips（primarySoft 底、可 × 移除），輸入框 Enter/「加入」/點推薦加入新值；
    「清單」的 `<select>`（「＋ 選擇加入…」）列出未選的全部選項。`history` 項目
    可以是字串或 `{ value, label }`——事件標籤用後者，子標籤 label 帶「└ 」縮排、
    選了存的是純名字（標籤清單維持階層順序，不做最近使用排序）。表單 state 直接
    就是陣列。推薦 chip 用 `onMouseDown preventDefault` 避免先觸發輸入框 blur。
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
  分類順序（`useDiary.moveCategory`，跟相鄰分類互換 `sort_order`，邊界 disable）、
  點名稱行內改名（`InlineName` 內部元件：span ↔ 底線 input，Enter/失焦送出、Esc 取消，
  分類/主標籤/子標籤三層共用）、▾/▸ 收合整個分類、刪除分類（兩段確認，連動清掉既有
  日記裡用到的主/子標籤，見 `useDiary.deleteCategory`）。每個主標籤一列（`TagBox`
  內部元件）：▲▼ 排序（`moveTagInCategory`，直接在 `tags` 陣列裡交換位置，順序就是
  陣列順序）、點名字改名、子標籤數 badge、▾/▸ 展開子標籤區、× 刪除。展開後子標籤是
  圓角 chip：‹ › 左右排序（`moveSubTag`）、點名字改名（`renameSubTag`）、× 刪除
  （`removeSubTag`）、虛線「+ 新增」pill 點開變輸入框（`addSubTag`）；主標籤同樣用
  虛線「+ 新增主標籤」pill 新增。全程沒有拖曳——mockup 用 HTML5 drag，但在手機版
  LINE LIFF webview 裡觸控拖曳不可靠，一律用按鈕。
  **標籤名稱全域唯一（含子標籤）**：改名/新增前都用 `useDiary.findTagOwner()` 檢查，
  撞名就顯示錯誤提示不送出。特例：在某分類新增一個「別的分類已在用的**主標籤**」名稱
  時，彈出「要移到 Z 嗎？」確認卡片，確認後 `moveTagToCategory` 整個標籤物件（連同
  子標籤）搬過去（不影響既有日記的 `tags`，存的是名字字串，換分類不會變）；撞到的
  是**子標籤**則直接擋下提示。
  **主標籤/子標籤改名會同步改寫舊日記**：`useDiary.js` 的 `renameTagInCategory`/
  `renameSubTag` 共用 `syncEntriesTagRename()`——`diary_entries.tags` 陣列裡的字串、
  `tag_details` 的 key 一起換成新名字，避免孤兒標籤；前端 `Promise.all` 迴圈更新，
  不是資料庫層級的 cascade。
- **`ManageOptions.jsx`** — 管理地點、人名與事件標籤（設定頁的另一個子頁，管的是
  `event_options` 選項庫，跟 `ManageTags.jsx` 管的日記分類是兩套獨立機制）。三個
  區塊：地點、和誰（人名）、事件標籤（每個標籤卡片內含子標籤列表 + 新增子標籤輸入列）。
  每一列（`OptionRow` 內部元件）：**點名字直接改**（Enter/失焦送出；改名先走
  `useOptions.renameOption()`——同層撞名自動合併——再用 `useEvents`/`useDiary` 的
  `renameFieldValue()` 同步改寫過去引用的事件/日記，跟 `renameTagInCategory` 同一套
  「前端 Promise.all 迴圈、不是 DB cascade」的做法）、**使用次數**（前端從已載入的
  事件+日記算的，地點/人名兩邊都算、標籤只算事件）、**封存/恢復**（封存只影響之後的
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

五張表，都在 `calendar` schema：

### `events`（完整 SQL 見 `supabase/schema.sql` + `2026-07-02_event_color_tags.sql` +
`2026-07-04_event_location.sql` + `2026-07-08_event_people.sql`）

| 欄位 | 型別 | 用途 |
|---|---|---|
| `id` | bigint (PK, identity) | 主鍵 |
| `user_id` | uuid → `auth.users(id)` | 事件擁有者（CASCADE） |
| `title` | text | 事件標題 |
| `description` | text | 備註（選填） |
| `location` | text | 地點（選填，Day 檢視顯示在描述上方，帶 📍） |
| `people` | text[] | 同伴（選填，表單用 `HistoryFields.jsx` 的選單/自行輸入加人，顯示帶 👤，跟日記 `people` 同一套慣例） |
| `start_at` | timestamptz | 開始時間 |
| `end_at` | timestamptz | 結束時間（選填） |
| `all_day` | boolean | 是否為全天事件 |
| `color` | text | 顏色（`EVENT_COLORS` 其中一個 hex，選填） |
| `tags` | text[] | 標籤（存純名字字串；選單與母/子階層由 `event_options` 管理，跟日記標籤是兩套獨立機制） |
| `created_at` | timestamptz | 建立時間 |

### `diary_entries`（完整 SQL 見 `supabase/2026-07-02_diary.sql` + `2026-07-06_diary_tag_details.sql`）

| 欄位 | 型別 | 用途 |
|---|---|---|
| `id` | bigint (PK, identity) | 主鍵 |
| `user_id` | uuid → `auth.users(id)` | 擁有者（CASCADE） |
| `entry_date` | date | 這則日記屬於哪一天（不是 timestamptz，日記本來就是「屬於某天」不是某個精確時刻） |
| `all_day` | boolean | 全天日記（不記錄時間） |
| `time` / `end_time` | text | `HH:MM` 字串（不用 `time` 型別，避免時區/格式化的額外複雜度，反正只是顯示用） |
| `locations` | text[] | 地點，可多個（原本是單值 `location` text，2026-07-10 migration 改名＋轉陣列；顯示時用「、」串接） |
| `people` | text[] | 和誰在一起（表單用 `HistoryFields.jsx` 的選單/自行輸入加人，直接存陣列） |
| `tags` | text[] | 選中的標籤（主標籤或子標籤都以**名字字串**扁平存放，必須存在於某個
  `tag_categories.tags`，但沒有資料庫層級外鍵約束，刪除分類/標籤時由前端 `useDiary.js`
  主動同步清掉） |
| `tag_details` | jsonb | 標籤 → 細節文字的 map，例如 `{"追劇":"想見你 EP5"}`。**不是每個標籤都會有值**，
  只有使用者真的填了才會有 key（`DiaryForm.jsx` 存檔前會清掉沒填細節、或標籤已經
  取消選取的殘留 key，見下方設計重點）。故意不改 `tags` 本身的結構（拆成
  `[{tag, detail}]` 物件陣列）——日記的 `tags` 維持純字串陣列（子標籤也是存名字），
  用獨立的 `tag_details` map 疊加細節，改動範圍小很多 |
| `note` | text | 心情筆記（選填） |
| `created_at` | timestamptz | 建立時間 |

### `tag_categories`（完整 SQL 見 `supabase/2026-07-02_diary.sql` + `2026-07-05_category_sort_order.sql` + `2026-07-09_tag_subtags.sql`）

| 欄位 | 型別 | 用途 |
|---|---|---|
| `id` | bigint (PK, identity) | 主鍵 |
| `user_id` | uuid → `auth.users(id)` | 擁有者（CASCADE），每人的分類/標籤互不相通 |
| `name` | text | 分類名稱（工作/社交/心情/健康…） |
| `tags` | jsonb | 這個分類底下的標籤，**不是獨立一張表**，直接存陣列。2026-07-09 起從 `text[]`
  改成 `[{ "name": "運動", "subs": ["跑步"] }]` 支援子標籤；migration 會把舊字串
  元素自動包成物件（可重跑），也會修復 migration 沒跑期間 app 寫進 `text[]` 被
  PostgREST 壓成 JSON 字串的元素（解析回物件），前端 `useDiary.normalizeCategories()` 另外兜底 |
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
- **標籤沒有正規化成獨立表** — `tag_categories.tags` 直接存文字陣列，`diary_entries.tags`
  也是文字陣列存標籤字串本身（不是外鍵 ID）。優點是 CRUD 簡單（改分類名稱不用管
  join，刪標籤就是從陣列拿掉一個字串）；代價是「改標籤名稱」等於「這個標籤在所有
  地方都變成新字串，跟舊字串的日記對不上」——目前沒有改標籤名稱的 UI（只有新增/刪除），
  所以還沒踩到這個限制，但以後如果要加「重新命名標籤」功能，要一併更新所有引用該標籤的
  `diary_entries.tags`，不能只改 `tag_categories.tags`。
- **標籤名稱在同一使用者底下全域唯一，不是只在單一分類內唯一** — 沒有資料庫層級的
  唯一約束，是 `ManageTags.jsx` 在新增時前端擋掉（`allCategories.find(...)`）；
  這樣設計是因為 `diary_entries.tags` 存的是標籤字串本身、不帶分類資訊，如果同一個
  字串在兩個分類都存在，`categoryAccentForTag`（`theme.js`）沒辦法判斷這個標籤該用
  哪個分類的強調色，日記卡片上的顏色會不穩定。
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
- **所有「Enter 送出」的文字輸入框都要先擋 IME 組字** — `onKeyDown` 開頭一律
  `if (e.nativeEvent.isComposing) return;`。中文輸入法選字按 Enter 確認時 `keydown`
  也會觸發，不擋的話打到一半的字（例如只打了姓氏）就會被直接送出。目前套用在
  `HistoryFields.jsx`、`DiaryForm.jsx`、`ManageOptions.jsx`、`ManageTags.jsx`；
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

> 新環境依序跑：`schema.sql` → `2026-07-02_event_color_tags.sql` → `2026-07-02_diary.sql`
> → `2026-07-02_tasks.sql` → `2026-07-04_event_location.sql` → `2026-07-05_category_sort_order.sql`
> → `2026-07-06_diary_tag_details.sql` → `2026-07-08_event_people.sql` → `2026-07-09_event_options.sql`
> → `2026-07-09_tag_subtags.sql` → `2026-07-10_diary_locations_array.sql`。之後有新欄位/新表再依日期新增檔案，格式跟其他 app 一致：
> `YYYY-MM-DD_描述.sql`。

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
