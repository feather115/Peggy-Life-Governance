# peggy-life

Monorepo，包含兩個獨立的 app，各自部署到不同的 Vercel 專案。

## Apps

- [`apps/calorie-tracker`](./apps/calorie-tracker) — 飲食卡路里記錄 app（React + Vite + Supabase + LINE LIFF）
- [`apps/recipe-book`](./apps/recipe-book) — Peggy 食譜 app（React + Vite + Supabase + LINE LIFF）

每個 app 的設定、開發、部署細節請看各自資料夾裡的 README。

## 安裝

```bash
npm install
```

會用 npm workspaces 一次裝好兩個 app 的依賴。

## 開發

```bash
npm run dev:calorie-tracker
npm run dev:recipe-book
```

或直接進到 `apps/<app>` 資料夾跑 `npm run dev`。

## 部署到 Vercel

兩個 app 各自建立獨立的 Vercel 專案，連到同一個 GitHub repo，並在專案設定的
**Root Directory** 分別指向：

- `apps/calorie-tracker`
- `apps/recipe-book`

Vercel 會自動偵測 Root Directory 下的 `package.json` 並只建置該 app，互不影響。
記得在各自的 Vercel 專案環境變數中設定對應的 `.env` 內容（不要 commit `.env`）。

### 避免互相觸發部署（Ignored Build Step）

兩個 Vercel 專案連同一個 repo，預設只要 push 到 main、**不管改哪個 app** 都會觸發兩邊重新部署。
要讓它們只在自己的目錄有變動時才 build，到各專案的 **Settings → Git → Ignored Build Step** 貼上：

calorie-tracker 專案：
```bash
git diff --quiet HEAD^ HEAD -- apps/calorie-tracker packages/shared
```

recipe-book 專案：
```bash
git diff --quiet HEAD^ HEAD -- apps/recipe-book packages/shared
```

行為跟直覺相反：這個指令對應目錄**沒有**改動時會 exit 0 → Vercel 視為「跳過這次 build」；
**有**改動時 exit 非 0 → 正常部署。兩條都帶 `packages/shared`，因為改了共用套件兩個 app 都該重新部署。

## 共用套件

- [`packages/shared`](./packages/shared) — `@peggy-life/shared`，提供 Supabase client factory (`createAppSupabase`) 和共用元件 (`ConfigMissing`)

## Supabase 架構

兩個 app 共用同一個 Supabase 專案，用不同的 PostgreSQL schema 隔離資料：

| Schema | 用途 | 內容 |
|---|---|---|
| `calorie_tracker` | 飲食卡路里 | 11 張表 + 2 個 RPC (`is_challenge_member`, `find_challenge_by_code`) |
| `recipe_book` | 食譜紀錄 | `recipes` 表 |
| `auth` | 共用驗證 | Supabase 內建 `auth.users`，兩個 app 共用同一群使用者 |
| `public` | trigger | `handle_new_user` trigger function（綁在 `auth.users` 上，所以留在 public） |

### 第一次設定 Supabase（完整順序）

1. 到 [Supabase Dashboard](https://supabase.com) 建立專案
2. 左側 **SQL Editor**，依序貼上並執行：
   - `apps/calorie-tracker/supabase/schema.sql`（建立基本表在 public）
   - `apps/calorie-tracker/supabase/` 下的各 migration SQL（按日期順序）
   - `apps/recipe-book/supabase/schema.sql`
   - 最後跑兩支 schema isolation migration：
     - `apps/calorie-tracker/supabase/2026-06-28_schema_isolation.sql`（把 11 張表從 public 搬到 `calorie_tracker` schema，並授權給 PostgREST 及 service_role）
     - `apps/recipe-book/supabase/2026-06-28_schema_isolation.sql`（把 recipes 從 public 搬到 `recipe_book` schema，並授權給 PostgREST 及 service_role）
3. 到 **Integrations → Data API → Settings**，在 **Exposed schemas** 加入 `calorie_tracker` 和 `recipe_book`，按 Save
4. 等 30 秒讓 PostgREST 重新載入
5. 到 **Settings → API** 複製 `Project URL` 和 `anon public` key，填入各 app 的 `.env`

> **注意**：schema isolation migration 會搬移表並重建 RLS policy，跑之前確認 `schema.sql` 和其他 migration 都已執行完畢。
