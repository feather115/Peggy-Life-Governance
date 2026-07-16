# UI 離線樣板 SOP（ui-demo.html + UI-SPEC.md）

目的：讓 AI（或人）在**不跑 app、不連網**的情況下知道某個 app 的 UI 長什麼樣子。
每個 app 產出兩個檔，放在 `apps/<app-name>/` 根目錄：

| 檔案 | 是什麼 | 給誰看 |
|---|---|---|
| `ui-demo.html` | 自包含靜態 mockup（假資料、內嵌色票、無網路、無 build），瀏覽器直接開 | AI 讀 DOM/樣式；人用眼睛驗收 |
| `UI-SPEC.md` | 精簡規格：色票表、畫面地圖、卡片解剖、互動慣例，每項對應到元件檔 | AI 改 UI 前先讀 |

範例成品：`apps/calendar/ui-demo.html` + `apps/calendar/UI-SPEC.md`（第一份，照抄它的結構）。

## 產生步驟（給 AI 的指令流程）

1. **盤點樣式來源**：讀 `src/theme.js`（或該 app 的樣式常數檔）。色票、圓角、陰影全部逐字搬進
   `ui-demo.html` 的 `:root` CSS variables，並註明來源檔。**不得自創或近似色碼**。
2. **盤點畫面**：讀 `App.jsx` 找出所有 view / overlay（畫面清單通常在檔頭註解或 switch）。
   每個畫面對應一個 `<div class="screen">`，加一個 demo 專用切換列（標明「非 app UI」）。
3. **逐元件抄版型**：讀 `src/components/*.jsx`，把每個元件的 inline style 翻成 CSS class，
   class 名對應元件檔名（如 `.viewtabs` ← `ViewTabs.jsx`），檔內加註解標明對應關係。
   數值（px、字級、間距）照抄，不要「大概」。
4. **塞假資料**：手寫足以呈現所有視覺狀態的假資料——今天/選中/一般日期、空狀態、
   計時卡/全天卡/任務卡、逾期/今天到期/未來、選中/未選 chip。資料內容用貼近實際使用的中文。
5. **寫 UI-SPEC.md**：照 calendar 版的章節——整體版型、色票表、畫面地圖（表格：畫面/元件檔/重點版型）、
   共用卡片解剖、互動慣例。控制在 100 行內，寫「哪裡長怎樣、程式在哪」，不寫實作細節。
6. **驗證**：瀏覽器開 `ui-demo.html`，逐畫面跟實際 app 比對；確認斷網也能開（無任何外部資源）。

## 硬性規則

- **單一 HTML、零依賴**：不引任何 CDN/字型/圖片，JS 只做畫面切換與假資料渲染。
- **樣板是照片不是實作**：不搬 app 邏輯（hooks、資料流），只搬長相。demo 專用程式碼要註明。
- **同步義務**：改了 app 的視覺（色票/版型/間距/畫面增減），同一次 commit 更新 `ui-demo.html`、
  `UI-SPEC.md`，並更新兩份檔內的「最後同步」日期。只改邏輯不改長相則不用動。
- 檔內註解與 SPEC 一律繁體中文，符合 AGENTS.md。

## AI 使用方式（改 UI 時）

改某 app 的 UI 前：先讀 `apps/<app>/UI-SPEC.md` → 需要細節再讀 `ui-demo.html` 對應區塊 →
再進 `src/components/` 動手。產出後記得履行上面的同步義務。
