# TY Calendar

個人行程管理：月/週/日三種檢視、事件（含顏色/標籤/地點/和誰，地點與人名預設直接
輸入、打字時即時推薦歷史選項（依最近使用排序），也可按「清單」瀏覽全部；標籤支援
母/子兩層，選項可在設定頁維護、封存、改名）、
日記（多筆/天，地點可多個，標籤依分類管理，支援分類→主標籤→子標籤三層；可填選填的
標題；「今天的感覺」分文字描述＋＃快速注記兩種輸入。月/週/日三個檢視共用同一套
白底卡片版型：時間在卡片頂端、標題大字、描述小字、＃注記 pill、分隔線下是標籤
chip 與地點/同伴，純標籤打卡則只有時間＋標籤 chip）、
週期性任務（標記完成自動算下次到期日）。跟 calorie-tracker、recipe-book 共用同一個
Supabase 專案的使用者（`auth.users`），可以在 LINE App 裡直接開啟並自動登入。

---

## 第一次設定

### 1. 安裝套件

在 monorepo 根目錄一次裝好所有 workspace：

```bash
npm install
```

### 2. 設定 Supabase

1. 沿用 calorie-tracker / recipe-book 用的同一個 Supabase 專案（三個 app 共用使用者池，
   資料表在各自獨立的 schema）
2. 左側 **SQL Editor**，依序貼上並執行：
   - [`supabase/schema.sql`](./supabase/schema.sql)（建立 `calendar` schema + `events` 表 + RLS）
   - [`supabase/2026-07-02_event_color_tags.sql`](./supabase/2026-07-02_event_color_tags.sql)
     （`events` 加顏色/標籤欄位）
   - [`supabase/2026-07-02_diary.sql`](./supabase/2026-07-02_diary.sql)
     （建日記 + 標籤分類的表）
   - [`supabase/2026-07-02_tasks.sql`](./supabase/2026-07-02_tasks.sql)
     （建週期性任務的表）
   - [`supabase/2026-07-04_event_location.sql`](./supabase/2026-07-04_event_location.sql)
     （`events` 加地點欄位）
   - [`supabase/2026-07-05_category_sort_order.sql`](./supabase/2026-07-05_category_sort_order.sql)
     （分類加自訂排序欄位）
   - [`supabase/2026-07-06_diary_tag_details.sql`](./supabase/2026-07-06_diary_tag_details.sql)
     （日記標籤加細節欄位，例如追劇填劇名）
   - [`supabase/2026-07-08_event_people.sql`](./supabase/2026-07-08_event_people.sql)
     （`events` 加同伴欄位）
   - [`supabase/2026-07-09_event_options.sql`](./supabase/2026-07-09_event_options.sql)
     （建地點/人名/事件標籤選項庫，並回填既有資料）
   - [`supabase/2026-07-09_tag_subtags.sql`](./supabase/2026-07-09_tag_subtags.sql)
     （日記標籤支援子標籤：`tag_categories.tags` 從 text[] 改成 jsonb，舊資料自動轉換）
   - [`supabase/2026-07-10_diary_locations_array.sql`](./supabase/2026-07-10_diary_locations_array.sql)
     （日記地點改成多個：`location` text 改名 `locations` 並轉 text[]）
   - [`supabase/2026-07-10_diary_hashtags.sql`](./supabase/2026-07-10_diary_hashtags.sql)
     （日記加 `hashtags` 欄位：＃快速注記）
   - [`supabase/2026-07-10_diary_title.sql`](./supabase/2026-07-10_diary_title.sql)
     （日記加 `title` 欄位：日檢視卡片的大字標題）
3. **Integrations → Data API → Settings → Exposed schemas** 加上 `calendar`（如果還沒加），
   儲存後等 30 秒。如果加完還是回 `PGRST106`/`Invalid schema`，這是 Supabase 平台已知
   問題，去 SQL Editor 跑 `ALTER ROLE authenticator SET pgrst.db_schemas = '...'` +
   `NOTIFY pgrst, 'reload config'`（見根目錄 [`docs/new-app-sop.md`](../../docs/new-app-sop.md) 第 3 節）
4. 左側 **Settings → API**，複製 `Project URL` 和 `anon public` key
5. 複製 `.env.example` 成 `.env`，填入：
   ```
   VITE_SUPABASE_URL=https://你的專案.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_LIFF_ID=12345678-abcdef   # 選填，要在 LINE 裡開啟並自動登入才需要
   LINE_CHANNEL_ID=1234567890     # 選填，同上
   SUPABASE_SERVICE_ROLE_KEY=eyJ... # 選填，同上（伺服器端用，極機密）
   ```
   LINE 登入用的 `line_links` 對照表跟其他 app 共用，存在獨立的 `shared` schema
   （見 [`ARCHITECTURE.md`](./ARCHITECTURE.md) 說明），不用另外建表，但要確保
   `packages/shared/supabase/2026-07-01_line_links_to_shared.sql` 已經跑過、
   且 `shared` 已加進 Exposed schemas。

---

## 開發

從 monorepo 根目錄：

```bash
npm run dev:calendar
```

或進到本資料夾跑 `npm run dev`（預設 port 3457，跟 calorie-tracker 的 3456、
recipe-book 的 5173 不衝突，可以三個一起開）。

---

## 部署到 Vercel

1. 建立新的 Vercel 專案，連到本 monorepo
2. **Settings → Root Directory** 設成 `apps/calendar`
3. **Environment Variables** 補上 `.env.example` 裡列的變數
4. **Settings → Git → Ignored Build Step** 填：
   ```bash
   git diff --quiet $VERCEL_GIT_PREVIOUS_SHA HEAD -- apps/calendar packages/shared
   ```
   避免改動其他 app 時誤觸發這個 app 重新部署

Vercel 會用本資料夾的 `package.json` 自動偵測 Vite，不影響其他 app。

---

## 程式結構

對齊 calorie-tracker / recipe-book 的慣例：`main.jsx → Root.jsx → App.jsx → components/`，
事件狀態集中在 `useEvents.js`，日記與標籤分類狀態集中在 `useDiary.js`，週期性任務狀態
集中在 `useTasks.js`，純函式在 `utils.js`，配色常數在 `theme.js`，Supabase 查詢在
`db.js`，Supabase client 走共用 `@peggy-life/shared`。詳細檔案地圖見
[`ARCHITECTURE.md`](./ARCHITECTURE.md)。
