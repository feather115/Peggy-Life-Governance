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
   （一次建好 6 張表、權限、註冊 trigger）
3. **挑戰功能 migration**：再貼一次 [`supabase/2026-06-25_weight_challenge.sql`](./supabase/2026-06-25_weight_challenge.sql) → Run（建立 3 張挑戰相關表 + RLS）
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
