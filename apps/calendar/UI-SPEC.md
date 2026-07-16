# calendar UI-SPEC（離線 UI 規格）

搭配同目錄的 `ui-demo.html`（可離線開啟的靜態樣板）一起看。
用途：AI 或人在**不跑 app、不連網**的情況下掌握 UI 現況。改 UI 前先讀這兩份。
同步規則：改了視覺（色票/版型/間距/畫面結構）→ 同步更新這兩份。最後同步：2026-07-16。
產生／更新方式見 `docs/ui-demo-sop.md`。

## 整體版型

- 手機優先：`App.jsx` 外殼 520px 置中直欄、`height:100vh`、內容區獨立捲動。
- 全部 inline style，樣式常數集中在 `src/theme.js` 的 `THEME`（柔和藍主題），**不得自創色碼**。
- 無 CSS 框架、無 icon library（icon 用文字符號：⚙ ‹ › ＋ ☐ 📍 👤）。

## 色票與常數（src/theme.js）

| 名稱 | 值 | 用途 |
|---|---|---|
| bg | `#EEF2F7` | 頁面底色 |
| surface | `#FFFFFF` | 白卡 |
| surfaceAlt / surfaceAlt2 | `#F4F7FB` / `#F7F9FC` | segmented 底、任務卡底、週列底 |
| primary / primaryDark | `#3D5A80` / `#2C4562` | 主色（按鈕、選中、今天圓點） |
| primarySoft | `#E3EAF4` | 選中底色、全天卡底、hashtag 底 |
| textDark / textMuted / textFaint | `#1F2D42` / `#7C8AA0` / `#B7C0D1` | 文字三階 |
| border | `#E7ECF3` | 邊框、分隔線 |
| radius / radiusSm / radiusSmInner | 20 / 14 / 11 | 面板卡 / 小卡與按鈕 / segmented 內層 |
| error / errorBg | `#B91C1C` / `#FEE2E2` | 逾期、錯誤框 |
| shadow | 見 theme.js | 面板卡陰影 |
| hashtagInk / hashtagBg | `#2C4562` / `#E3EAF4` | ＃快速注記 chip |

事件顏色 `EVENT_COLORS`（7 色）與分類 accent `CATEGORY_ACCENTS`（5 色，依分類順序輪配）也在 theme.js。

## 畫面地圖（App.jsx 的 view + overlay）

主畫面 = header（TY Calendar + ⚙）→ ViewTabs（月/週/日/任務 segmented + 「今天」鈕）→ 內容區。
overlay（表單/設定）出現時**整個取代** header+tabs，全螢幕顯示。

| 畫面 | 元件檔 | 重點版型 |
|---|---|---|
| 月 | `MonthView.jsx` | 白卡月曆面板（‹ 年月 ›、圖例、7 欄格線）＋下方「選中日摘要卡」。日期格：28px 圓 badge（今天=primary 實心白字；選中非今天=primarySoft 底），下方最多 3 顆紀錄圓點（事件色）＋任務**方點**（textMuted）。點日期只換摘要卡；點摘要卡標題→日檢視；點單項→編輯 |
| 週 | `WeekView.jsx` | 單一白卡面板，7 天直向列（surfaceAlt2 底、選中=primarySoft），每列日期標籤＋TimelineItems（純顯示不可點，整列可點→日檢視） |
| 日 | `DayView.jsx` | ‹ 日期 › 導覽＋TimelineItems（可點→編輯）＋sticky 底部「＋ 新增紀錄」primary 大按鈕 |
| 任務 | `TasksView.jsx` | 標題列＋「＋ 新增任務」；任務卡（surfaceAlt2）：標題/週期/上次完成＋右上到期狀態（逾期=error、今天=primary、未來=textMuted）＋動作列（標記完成/歷史/刪除，刪除需點兩次） |
| 紀錄表單 | `RecordForm.jsx` | header（‹ 返回＋標題＋右側圓形「確認」鈕）；「計畫」區（標題/顏色 7 圓點/時間/選項庫標籤/備註）與「回顧」區（今天的感覺/＃注記/分類標籤卡）用細線分區標頭隔開；回顧區可收合。分類標籤卡＝白卡＋主標籤實心 chip＋子標籤「└ 」外框 chip |
| 任務表單 | `TaskForm.jsx` | 同表單版型：標題＋週期（數字+單位）＋顯示於行事曆開關 |
| 設定/管理 | `Settings.jsx`、`ManageTags.jsx`、`ManageOptions.jsx` | 同 overlay 版型，列表式管理畫面 |

## 時間軸卡片（TimelineItems.jsx，三檢視共用）

一條時間軸只有兩種項目，改這個檔三個檢視同時生效：

1. **紀錄卡**（計畫+回顧疊一起，有什麼顯示什麼）
   - 計時卡：白底＋border、時間列 13px 粗體在頂端、標題 15px（前面 8px 事件色圓點）
   - 全天卡：primarySoft 底、無 border、無時間列、標題放大 17px；卡上所有 chip 換白底（避免同色被吃掉）
   - 內容順序：時間 → 標題/備註/感覺 → ＃注記 chips → 選項庫標籤 chips → 分隔線 → 分類標籤 chips（accent 色）＋📍👤 資訊列
2. **任務卡**：surfaceAlt 底＋**虛線** border、☐ + 標題 + 「任務 · 每 N 單位一次」

## 互動慣例

- chip 一律 `border-radius:999px`；選中 chip = primary 實心白字＋藍陰影。
- 危險操作用「點兩次確認」（刪除→確定刪除？），不用 modal。
- 按鈕無 focus outline（`outline:'none'`），今天徽章 = primary 圓角膠囊白字 11px。
