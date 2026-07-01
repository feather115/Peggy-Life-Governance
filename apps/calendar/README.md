# TY Calendar

個人行程管理：月/週/日三種檢視、新增/編輯/刪除事件。跟 calorie-tracker、recipe-book
共用同一個 Supabase 專案的使用者（`auth.users`），可以在 LINE App 裡直接開啟並自動登入。

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
2. 左側 **SQL Editor** → 貼上 [`supabase/schema.sql`](./supabase/schema.sql) → **Run**
   （建立 `calendar` schema + `events` 表 + RLS）
3. **Integrations → Data API → Settings → Exposed schemas** 加上 `calendar`（如果還沒加），
   儲存後等 30 秒
4. 左側 **Settings → API**，複製 `Project URL` 和 `anon public` key
5. 複製 `.env.example` 成 `.env`，填入：
   ```
   VITE_SUPABASE_URL=https://你的專案.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_LIFF_ID=12345678-abcdef   # 選填，要在 LINE 裡開啟並自動登入才需要
   LINE_CHANNEL_ID=1234567890     # 選填，同上
   SUPABASE_SERVICE_ROLE_KEY=eyJ... # 選填，同上（伺服器端用，極機密）
   ```
   LINE 登入用的 `line_links` 對照表跟其他 app 共用，實際存在 `calorie_tracker` schema
   （見 [`ARCHITECTURE.md`](./ARCHITECTURE.md) 說明），不用另外建表。

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
狀態集中在 `useEvents.js`，純函式在 `utils.js`，Supabase 查詢在 `db.js`，
Supabase client 走共用 `@peggy-life/shared`。詳細檔案地圖見 [`ARCHITECTURE.md`](./ARCHITECTURE.md)。
