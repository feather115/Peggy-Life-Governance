# peggy-life

Monorepo，包含三個獨立的 app，各自部署到不同的 Vercel 專案。

## Apps

- [`apps/calorie-tracker`](./apps/calorie-tracker) — 飲食卡路里記錄 app（React + Vite + Supabase + LINE LIFF）
- [`apps/recipe-book`](./apps/recipe-book) — Peggy 食譜 app（React + Vite + Supabase + LINE LIFF）
- [`apps/calendar`](./apps/calendar) — 個人行事曆 app（React + Vite + Supabase + LINE LIFF）

每個 app 的設定、開發、部署細節請看各自資料夾裡的 README。

> 想加第三個 app？照 [`docs/new-app-sop.md`](./docs/new-app-sop.md) 的 SOP 做，
> 會自動跟現有兩個 app 風格一致（目錄結構、Supabase schema 隔離、狀態中樞模式、部署設定）。

## 安裝

```bash
npm install
```

會用 npm workspaces 一次裝好所有 app 的依賴。

## 開發

```bash
npm run dev:calorie-tracker
npm run dev:recipe-book
npm run dev:calendar
```

或直接進到 `apps/<app>` 資料夾跑 `npm run dev`。

## 部署到 Vercel

每個 app 各自建立獨立的 Vercel 專案，連到同一個 GitHub repo，並在專案設定的
**Root Directory** 分別指向：

- `apps/calorie-tracker`
- `apps/recipe-book`
- `apps/calendar`

Vercel 會自動偵測 Root Directory 下的 `package.json` 並只建置該 app，互不影響。
記得在各自的 Vercel 專案環境變數中設定對應的 `.env` 內容（不要 commit `.env`）。

### 避免互相觸發部署（Ignored Build Step）

多個 Vercel 專案連同一個 repo，預設只要 push 到 main、**不管改哪個 app** 都會觸發全部重新部署。
要讓它們只在自己的目錄有變動時才 build，到各專案的 **Settings → Git → Ignored Build Step** 貼上：

calorie-tracker 專案：
```bash
git diff --quiet $VERCEL_GIT_PREVIOUS_SHA HEAD -- apps/calorie-tracker packages/shared
```

recipe-book 專案：
```bash
git diff --quiet $VERCEL_GIT_PREVIOUS_SHA HEAD -- apps/recipe-book packages/shared
```

calendar 專案：
```bash
git diff --quiet $VERCEL_GIT_PREVIOUS_SHA HEAD -- apps/calendar packages/shared
```

行為跟直覺相反：這個指令對應目錄**沒有**改動時會 exit 0 → Vercel 視為「跳過這次 build」；
**有**改動時 exit 非 0 → 正常部署。每條都帶 `packages/shared`，因為改了共用套件所有 app 都該重新部署。
用 `$VERCEL_GIT_PREVIOUS_SHA`（比較「上次成功部署到現在」整段）比 Vercel UI 內建的 `HEAD^`
選項（只看最近一個 commit）更準，連續 push 多個 commit 也不會漏判。

## 共用套件

- [`packages/shared`](./packages/shared) — `@peggy-life/shared`，提供 Supabase client factory (`createAppSupabase`) 和共用元件 (`ConfigMissing`)

## Supabase 架構

三個 app 共用同一個 Supabase 專案，用不同的 PostgreSQL schema 隔離資料：

| Schema | 用途 | 內容 |
|---|---|---|
| `calorie_tracker` | 飲食卡路里 | 11 張表 + 2 個 RPC (`is_challenge_member`, `find_challenge_by_code`) |
| `recipe_book` | 食譜紀錄 | `recipes` / `recipe_likes` / `cooking_history` 表 |
| `calendar` | 個人行事曆 | `events` 表 |
| `shared` | 三個 app 共用 | `line_links`（LINE 身份 ↔ Supabase 帳號對照）。第一次 expose 時卡過 `PGRST106`（Supabase 已知 bug：Dashboard/Management API 改的設定不保證同步到 PostgREST 實際讀的 Postgres `authenticator` 角色設定），正確修法是跑 `ALTER ROLE authenticator SET pgrst.db_schemas = '...'` + `NOTIFY pgrst, 'reload config'`（見 [`docs/new-app-sop.md`](./docs/new-app-sop.md) 第 3 節） |
| `auth` | 共用驗證 | Supabase 內建 `auth.users`，三個 app 共用同一群使用者 |
| `public` | trigger | `handle_new_user` trigger function（綁在 `auth.users` 上，所以留在 public） |

### 第一次設定 Supabase（完整順序）

1. 到 [Supabase Dashboard](https://supabase.com) 建立專案
2. 左側 **SQL Editor**，依序貼上並執行：
   - `apps/calorie-tracker/supabase/schema.sql`（建立基本表在 public）
   - `apps/calorie-tracker/supabase/` 下的各 migration SQL（按日期順序）
   - `apps/recipe-book/supabase/schema.sql`
   - `apps/calendar/supabase/schema.sql`（建立 `calendar` schema + `events` 表）
   - `apps/calendar/supabase/` 下其餘的 migration SQL（按日期順序：事件顏色/標籤、
     日記、任務、事件地點、分類排序，完整清單見 [`apps/calendar/README.md`](./apps/calendar/README.md)）
   - 最後跑兩支 schema isolation migration：
     - `apps/calorie-tracker/supabase/2026-06-28_schema_isolation.sql`（把 11 張表從 public 搬到 `calorie_tracker` schema，並授權給 PostgREST 及 service_role）
     - `apps/recipe-book/supabase/2026-06-28_schema_isolation.sql`（把 recipes 從 public 搬到 `recipe_book` schema，並授權給 PostgREST 及 service_role）
   - `apps/recipe-book/supabase/` 下其餘的 migration SQL，接在上面 schema isolation 之後、
     按日期順序（料理紀錄、擁有者/分享、RLS hotfix、按讚、使用者暱稱，完整清單見
     [`apps/recipe-book/README.md`](./apps/recipe-book/README.md)）
   - `packages/shared/supabase/2026-07-01_line_links_to_shared.sql`（建立 `shared` schema + `line_links` 表，三個 app 共用）
3. 到 **Integrations → Data API → Settings**，在 **Exposed schemas** 加入 `calorie_tracker`、`recipe_book`、`calendar`、`shared`，按 Save
4. 如果加完之後前端還是回 `Invalid schema` / `PGRST106`，這是 Supabase 平台已知 bug，Dashboard
   設定不保證同步到 PostgREST。在 SQL Editor 跑：
   ```sql
   ALTER ROLE authenticator SET pgrst.db_schemas = 'public, calorie_tracker, recipe_book, calendar, shared, graphql_public';
   NOTIFY pgrst, 'reload config';
   ```
   跑完立刻生效，詳見 [`docs/new-app-sop.md`](./docs/new-app-sop.md) 第 3 節。
5. 到 **Settings → API** 複製 `Project URL` 和 `anon public` key，填入各 app 的 `.env`

> **注意**：schema isolation migration 會搬移表並重建 RLS policy，跑之前確認 `schema.sql` 和其他 migration 都已執行完畢。

## 新增第四個 app？

照 [`docs/new-app-sop.md`](./docs/new-app-sop.md) 的 SOP 做，`apps/calendar` 就是照這份 SOP
從零建起來的例子，遇到不確定的地方可以直接參考它的檔案結構。
