# 飲食卡路里 App

記錄每日飲食、卡路里與三大營養素，支援斷食/記錄標籤、報表、AI 摘要。
資料存在 Supabase，可多裝置同步。手機與電腦瀏覽器皆可使用。

> 想知道程式長怎樣、改東西要開哪個檔 → 看 [`ARCHITECTURE.md`](./ARCHITECTURE.md)

---

## 第一次設定（三步驟）

### 1. 安裝套件
```bash
npm install
```

### 2. 設定 Supabase
1. 到 [supabase.com](https://supabase.com) 建立一個新專案
2. 左側 **SQL Editor** → 貼上 [`supabase/schema.sql`](./supabase/schema.sql) 全部內容 → **Run**
   （一次建好基本表、權限、註冊 trigger，建在 `public` schema）
3. 接著按 ARCHITECTURE 的 [Migration 檔案清單](./ARCHITECTURE.md#migration-檔案清單supabase) 依序跑增量 migration（最後一支
   [`2026-06-28_schema_isolation.sql`](./supabase/2026-06-28_schema_isolation.sql) 會把 11 張表都從 `public` 搬到
   `calorie_tracker` schema —— 跑這支**之前**先去 **Settings → API → Exposed schemas** 把 `calorie_tracker`
   加進去，儲存後等 30 秒）
4. 左側 **Settings → API**，複製 `Project URL` 和 `anon public` key
5. 複製 `.env.example` 成 `.env`，填入剛剛的兩個值：
   ```
   VITE_SUPABASE_URL=https://你的專案.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

> 想關掉註冊 email 驗證：Supabase → **Authentication → Providers → Email** → 關閉 *Confirm email*

### 3. 啟動
```bash
npx vite
```
打開 http://localhost:3456 → 第一次進去點「建立一個」帳號註冊。

---

## 常用指令

| 指令 | 用途 |
|---|---|
| `npx vite` | 開發伺服器（會即時更新） |
| `npx vite build` | 打包成靜態檔到 `dist/` |
| `npx vite preview` | 預覽打包結果 |

---

## 部署

`npx vite build` 後把 `dist/` 丟到任何靜態主機（Vercel / Netlify / GitHub Pages）。
記得在主機的環境變數也設定 `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_ANON_KEY`。

> **Schema 隔離注意事項**：這個 app 的 supabase client 預設用 `db.schema = 'calorie_tracker'`
> 連線（見 [`src/supabase.js`](./src/supabase.js)）。所以 Supabase 那邊要：
> 1. **Settings → API → Exposed schemas** 含 `calorie_tracker`
> 2. 所有 calorie-tracker 用到的表都在 `calorie_tracker` schema 下（schema 隔離 migration 已搬好）
>
> 若把 schema migration 跑了但忘記 expose schema，前端會收到 `relation does not exist` 之類的錯誤。
