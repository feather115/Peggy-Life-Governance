# peggy-life 設計系統

三個 app（飲食卡路里 / 食譜本 / 行事曆）共用的設計規範：設計概念、色彩系統、字型與尺寸、元件、可及性，以及改色、加新 app 的流程。
**要動介面之前先讀這份**；程式慣例（inline style、`S` 物件、hook 分工）見 [`new-app-sop.md`](./new-app-sop.md) 第 6 節。

> 本文件記錄的是 2026-09-30 定稿的版本。改規格時，**這份文件、`theme.css`、`ui.js` 和兩個守門測試要一起改**，不要只改其中一個。

---

## 1. 設計概念：同一套骨架，三種色系

一句話：**元件長得一模一樣，色系各自不同。**

| 統一的（三個 app 一致） | 各自的（每個 app 不同） |
|---|---|
| 元件樣式（頁首、清單、按鈕、膠囊、輸入框、底部分頁列…）| 主色（`--primary*`） |
| 字型 Figtree、字級 / 字重 / 圓角規格 | 底色、卡片凹陷區、邊線、文字灰階（中性色都帶該 app 的色調） |
| 語意色（info / success / danger / warning） | app 專屬的資料色（營養素、分類標籤、事件顏色…） |
| 版面結構、互動方式、可及性規則 | 遮罩與浮層陰影（用該 app 文字色的 rgba） |

為什麼這樣分：

- **一眼認得出在哪個 app**：使用者在 LINE 裡三個 app 切來切去，整片底色是最快的辨識線索（綠 = 吃、咖啡 = 烘焙、藍 = 行程）。
- **學一次就會用三個**：同一種操作在三個 app 長得一樣、放在一樣的位置。
- **維護成本低**：元件樣式只有一份（`packages/shared/src/ui.js`），改一次三個 app 一起變；各 app 只維護自己的 `theme.css`。

### 設計原則

1. **安靜的介面，內容優先**：卡片白底＋1px 邊線、不加陰影；只有真的「浮在上層」的東西（FAB、面板、toast、確認框）才有陰影。
2. **一個畫面最多一顆實心主色按鈕**：其他動作用淡主色 / 中性 / 純文字按鈕，主要動作永遠最醒目。
3. **不用 emoji**：介面文案與圖示都不放 emoji，圖示用線條 icon（`Icon.jsx`）；沒圖片時用名稱第一個字當佔位。
4. **手機優先、單手可操作**：內容寬度上限 520px，主要切換放底部分頁列，新增放右下 FAB，觸控範圍 ≥44px。
5. **看得清楚是硬規定**：文字對比 ≥4.5:1（淺色、深色都是），由測試把關，不靠目測。
6. **跟著系統走深色模式**：`prefers-color-scheme`，不另外做切換開關。

### 設計歷程（為什麼是現在這樣）

| 時間 | 版本 | 說明 |
|---|---|---|
| 2026-09-30 前 | 各自為政 | 三個 app 各有色系、卡片帶彩色陰影，元件各畫各的 |
| 2026-09-30 | 統一改版 | 共用 `ui.js`、Figtree、規格收斂；中性色三個 app 統一成暖白，只換主色 |
| 2026-09-30 | **恢復各自底色（現行）** | 保留統一的元件與規格，但中性色改回各 app 的色調；食譜本主色由陶土紅 `#9F4F2F` 改成咖啡棕 `#7B4A2D` |

討論用的設計稿（Design canvas，並排比較「目前」與「提案」三個畫面＋色票對照）：
<https://claude.ai/artifact/VLbXbyceANbebBcWwq2DaQ>（私人連結，要先從頁面的 Share 分享才能給別人看）

---

## 2. 色彩系統

### 2.1 色票的角色（token）

所有顏色都是 CSS 變數，定義在各 app 的 `src/theme.css`；元件裡一律寫 `'var(--xxx)'`，**不寫死色碼**。
三個 app 的變數名一致，同一個名字在每個 app 扮演同一個角色：

| 分類 | Token | 用途 | 規則 |
|---|---|---|---|
| 底 | `--bg` | 整頁底色（帶 app 色調） | 最能代表 app 的顏色 |
| | `--surface` | 卡片、清單、輸入框、底部分頁列 | 淺色模式固定白色 `#FFFFFF` |
| | `--surface-alt` | 卡片內的次要區塊 | 比 `--bg` 更淡 |
| | `--sunken` | 凹陷區：分段切換底、中性按鈕、關閉圓鈕 | 比 `--bg` 深一點 |
| 線 | `--line` | 卡片邊線、列與列的分隔線 | 很淡，幾乎只是區隔 |
| | `--line-strong` | 輸入框外框、未選中膠囊外框 | 要看得出「這裡可以點 / 輸入」 |
| | `--track` | 進度條底、骨架畫面色塊 | |
| 文字 | `--text` | 主要文字、標題 | 在 bg / surface / surface-alt 上 ≥4.5:1 |
| | `--text-muted` | 副標、說明、meta | 同上 |
| | `--text-faint` | 最淡的文字（未選中分頁、空狀態） | 同上，**不能再淡了** |
| 主色 | `--primary` | 實心主色底（主按鈕、FAB、今天圓點） | 上面放白字，白字對比 ≥4.5:1 |
| | `--primary-ink` | 主色當「字色」用（文字按鈕、選中分頁） | 淺色模式 = primary；深色模式要調亮 |
| | `--primary-soft` | 淡主色底（次要按鈕、選中膠囊、提示框） | primary-ink 放上面 ≥4.5:1 |
| | `--primary-strong` | （行事曆才有）更深的主色字 | |
| | `--on-primary` | 實心色底上的字 | 固定白色 |
| | `--ring` | 鍵盤焦點環 | = primary-ink |
| 語意 | `--info / --success / --danger / --warning` | 實心底（上面放白字） | 三個 app 共用同一組 |
| | `--*-ink` | 語意色當字色 | |
| | `--*-bg` | 語意色的淡底（提示框、標籤） | |
| 層次 | `--scrim` | 面板、確認框後面的遮罩 | 淺色用 app 文字色 rgba，深色用黑 |
| | `--shadow-card` | 卡片 | **是 1px 邊線不是陰影**：`0 0 0 1px var(--line)` |
| | `--shadow-nav` | 底部分頁列上緣 | 1px 線 |
| | `--shadow-sheet` / `--shadow-float` | 底部面板 / 浮在上層的東西 | 淺色用 app 文字色 rgba |

**最常犯的錯**：把 `--primary` 當字色用。`--primary` 是給「實心底色」的，深色模式下它還是深色，當字色會看不見；字色一律用 `--primary-ink`（其他語意色同理用 `*-ink`）。

### 2.2 三個 app 的色系

#### 飲食卡路里 — 森林綠

| Token | 淺色 | 深色 |
|---|---|---|
| `--bg` | `#EAF5EE` | `#0F1612` |
| `--surface` | `#FFFFFF` | `#18221C` |
| `--surface-alt` | `#F4F9F6` | `#1D2922` |
| `--sunken` | `#E3EFE7` | `#223028` |
| `--line` | `#DAE8DF` | `#26352D` |
| `--line-strong` | `#BFD3C6` | `#3B4D43` |
| `--track` | `#D6E8DD` | `#2A3A31` |
| `--text` | `#1F3A2E` | `#E5EFE9` |
| `--text-muted` | `#4A6557` | `#AEC2B6` |
| `--text-faint` | `#566F61` | `#93A99C` |
| `--primary` | `#29774F` | `#29774F` |
| `--primary-ink` | `#29774F` | `#8ECFA9` |
| `--primary-soft` | `#DDF0E4` | `#163223` |
| 陰影 / 遮罩 rgba | `31,58,46` | 黑 |

#### 食譜本 — 咖啡棕

| Token | 淺色 | 深色 |
|---|---|---|
| `--bg` | `#F6EEE6`（拿鐵） | `#16100D` |
| `--surface` | `#FFFFFF` | `#201814` |
| `--surface-alt` | `#FBF6F1` | `#28201B` |
| `--sunken` | `#EFE3D8` | `#2F2520` |
| `--line` | `#E9DACC` | `#3A2D26` |
| `--line-strong` | `#D5C0AE` | `#4C3C33` |
| `--track` | `#EADBCD` | `#3A2D26` |
| `--text` | `#35261C` | `#F4E9E2` |
| `--text-muted` | `#6B5242` | `#CFBAAE` |
| `--text-faint` | `#765C4B` | `#B6A194` |
| `--primary` | `#7B4A2D` | `#7B4A2D` |
| `--primary-ink` | `#7B4A2D` | `#E0B394` |
| `--primary-soft` | `#F3E3D6` | `#3A261A` |
| 陰影 / 遮罩 rgba | `53,38,28` | 黑 |

#### 行事曆 — 霧藍

| Token | 淺色 | 深色 |
|---|---|---|
| `--bg` | `#EEF2F7` | `#0F141B` |
| `--surface` | `#FFFFFF` | `#18202A` |
| `--surface-alt` | `#F4F7FB` | `#1D2631` |
| `--sunken` | `#E4EBF3` | `#222C38` |
| `--line` | `#DFE6EF` | `#2A3441` |
| `--line-strong` | `#C6D0DE` | `#3A4656` |
| `--track` | `#DCE5F0` | `#2A3441` |
| `--text` | `#1F2D42` | `#E4EAF2` |
| `--text-muted` | `#52617A` | `#A9B5C6` |
| `--text-faint` | `#5B6A82` | `#909DB0` |
| `--primary` | `#3F6AA1` | `#3F6AA1` |
| `--primary-ink` | `#3F6AA1` | `#99C1F4` |
| `--primary-strong` | `#2F5282` | `#BCD0F0` |
| `--primary-soft` | `#E1EBF8` | `#1C2C41` |
| 陰影 / 遮罩 rgba | `31,45,66` | 黑 |

「其他 App」入口（`packages/shared/src/OtherApps.jsx`）的 app 圖示底色用的就是這三個主色；改主色時那裡也要一起改。

### 2.3 語意色（三個 app 共用）

| | 實心底 | 字色（淺 / 深） | 淡底（淺 / 深） |
|---|---|---|---|
| info | `#4365B3` | `#4365B3` / `#9DBDFF` | `#E6F0FF` / `#1D2842` |
| success | `#21763C` | `#21763C` / `#90D09D` | `#E3F6E6` / `#15301B` |
| danger | `#B6322D` | `#B6322D` / `#FF9A8E` | `#FFE9E5` / `#3E1F1B` |
| warning | `#E1A447`（行事曆沒有） | `#90601F` / `#DFB585` | `#FEEDDB` / `#382409` |

語意色的意思固定，**不要拿來當裝飾色**：danger 只用在刪除、超標、錯誤；success 只用在完成、達標。

### 2.4 app 專屬的資料色

這些只存在於單一 app 的 `theme.css`（或 `theme.js`），用來表示資料，不是介面色：

- **飲食卡路里**：`--carb`（碳水，蜂蜜黃）、`--fat`（脂肪，水藍）；`--over`（超標）；熱力圖 `--heat-ok / --heat-near / --heat-over`；`--bar-empty`（空長條）；`--future-bg / --future-text`（未來日期）；`--goal-line`（目標線）；`--bronze-ink`（挑戰第三名）。蛋白質直接用主色。
- **食譜本**：`--like / --like-bg`（按讚的莓果紅）。
- **行事曆**：
  - `--cat-1`～`--cat-5`：日記分類標籤的字色（12px 小字放在 `--primary-soft` 上，每色 ≥4.5:1），依分類在清單中的順序分配。
  - `EVENT_COLORS`（`src/theme.js`）：紀錄可選的 7 個事件顏色：天空藍、湖水綠、嫩芽綠、蜂蜜黃、蜜桃橘、薰衣草、櫻花粉，亮度一致（L*≈61），白底對比 ≥3:1。這組是**使用者資料**（存在 DB），改色要寫 migration 把舊紀錄換掉，見 `apps/calendar/supabase/2026-09-30_refresh_event_colors.sql`。

### 2.5 色系是怎麼調出來的（新 app 照這個做）

三個 app 的中性色都是從主色的色相（H）推出來的，只調飽和度（S）和亮度（L）：

| 角色 | 色相 | 飽和度 | 亮度（淺色模式） | 三個 app 的實際值（H / S / L） |
|---|---|---|---|---|
| `--primary` | 主色 | 45–50% | 30–45%（白字要 ≥4.5:1） | 綠 149/49/31、咖啡 22/46/33、藍 214/44/44 |
| `--bg` | ≈ 主色 | 35–47% | 93–95% | 綠 142/35/94、咖啡 30/47/93、藍 213/36/95 |
| `--sunken` | ≈ 主色 | 27–42% | 89–92% | 比 bg 暗 2–4% |
| `--line` | ≈ 主色 | 23–40% | 86–91% | |
| `--line-strong` | ≈ 主色 | 19–32% | 76–82% | |
| `--primary-soft` | ≈ 主色 | 39–62% | 90–93% | |
| `--text` | ≈ 主色 | 30–36% | 16–19% | 近黑，但帶一點色調 |
| `--text-muted` | ≈ 主色 | 15–24% | 34–40% | |
| `--text-faint` | ≈ 主色 | 13–22% | 38–43% | 對 bg 剛好 ≥4.5:1 的上限 |

深色模式：底色用主色色相、亮度 5–15% 的深色（`bg < surface < surface-alt < sunken` 依序變亮），`--primary` 維持原值（實心按鈕），`--primary-ink` / `--ring` 改用亮度 70–80% 的淺色版本。

調色的順序：先定主色 → 推出 bg / sunken / line → 推出文字三階 → 跑 `npm test` 看對比度 → 不過就把文字調深一點、或把 bg 調淡一點。

---

## 3. 字型與文字

- **字型**：Figtree（Google Fonts，400/500/600）＋系統中文字型。`base.css`：
  `'Figtree','PingFang TC','Noto Sans TC','Microsoft JhengHei',system-ui,sans-serif`。每個 app 的 `index.html` 載入 Figtree。
- **字級只用** `12 / 13 / 14 / 15 / 16 / 18 / 24`（28 以上只給大數字，例如卡路里剩餘數字）：

| 字級 | 用在 |
|---|---|
| 24 / 600 | 頁面大標題（`UI.title`） |
| 18 / 600 | 內頁標題（`UI.subTitle`）、確認框標題 |
| 16 / 600 | 區塊標題（`UI.sectionTitle`） |
| 15 / 500 | 清單列標題、主按鈕、輸入框文字 |
| 14 / 500 | 次要按鈕、膠囊、分段切換、toast |
| 13 / 400–500 | 副標、meta、欄位標籤、提示框 |
| 12 / 500 | 標籤（`UI.tag`）、底部分頁列文字 |

- **字重只用** `400`（內文）/ `500`（強調）/ `600`（標題、選中狀態）。
- 數字用 `fontVariantNumeric: 'tabular-nums'`（`UI.num`、`UI.rowValue` 已經帶了），上下對齊不會跳動。
- 手機上輸入框強制 16px（`base.css`），避免 iOS 聚焦時自動放大。

## 4. 圓角、間距、層次

- **圓角只用** `10`（按鈕、輸入框、提示框）/ `14`（卡片、toast）/ `20`（確認框、底部面板）/ `999`（膠囊、圓鈕、FAB）。5 以下（進度條、小圓點）不限。
- **間距**（沒有測試強制，但請照這個節奏）：
  - 頁面左右留白 `20px`；頁首 `20px 20px 8px`
  - 區塊之間 `28px`（`UI.section`），區塊標題與卡片之間 `10px`
  - 清單列 `12px 16px`、最小高度 `56px`；分隔線從左邊 `16px` 開始
  - 同一排按鈕 / 膠囊間距 `8px`
- **層次**只有兩層：
  - 平面：卡片（1px 邊線，無陰影）
  - 浮起來：FAB、底部面板、確認框、toast，才用 `--shadow-float` / `--shadow-sheet`
- **內容寬度**上限 `520px`，置中（桌面瀏覽器打開也不會拉得很寬）。

## 5. 元件（`packages/shared`）

**先用現成的，不要自己重畫。** 需要新元件時先加進 `ui.js`，三個 app 一起受益。

| 檔案 | 內容 |
|---|---|
| `ui.js` → `UI` | 頁首 `header / title / subtitle / headerActions`、內頁頂列 `subBar / subTitle`、區塊 `section / sectionHead / sectionTitle / groupLabel`、卡片與清單 `card / listCard / row / rowText / rowTitle / rowMeta / rowValue / divider / addRow / empty`、按鈕 `btnPrimary / btnSecondary / btnNeutral / btnText / btnDanger / btnDangerText`、圓鈕 `iconBtn / iconBtnPlain / iconBtnSoft / fab`、`chip(on) / chipRow`、`segTrack / seg(on)`、`tag(tone)`、`input / textarea / fieldLabel / fieldError`、`stepper`、`note(tone)`、`num` |
| `BottomTabs.jsx` | 底部分頁列：icon＋文字，選中用主色字＋淡主色膠囊 |
| `Icon.jsx` | 線條 icon（stroke，`name` 取用） |
| `feedback.jsx` | `toast()`（一般用反白、錯誤用紅底，可附「復原」）、`confirmDialog()`（取代原生 confirm） |
| `LoadingSkeleton.jsx` | 骨架載入畫面；載入失敗用同檔的 `LoadError` |
| `OtherApps.jsx` | 設定頁的「其他 App」入口 |
| `base.css` | reset、字型、焦點環、按壓回饋、`.tap`（撐大觸控範圍）、`.btn-reset`、`.skeleton`、減少動態效果 |

按鈕怎麼選：

| 情境 | 用 |
|---|---|
| 這個畫面最主要的動作（儲存、新增）——一個畫面最多一顆 | `btnPrimary` |
| 次要但常用的動作 | `btnSecondary`（淡主色） |
| 中性動作（取消、關閉） | `btnNeutral` |
| 輕量動作、連結型 | `btnText` |
| 刪除 | `btnDanger` / `btnDangerText`，而且要先 `confirmDialog({ danger: true })` |
| 新增一筆（列表頁） | 右下 `UI.fab` |

## 6. 版面模式

每個主畫面都是同一個結構：

```
┌──────────────────────────┐
│ 大標題              (○)(○) │ ← UI.header：標題＋副標在左，圓鈕在右（‹ › 翻頁固定在右側）
│ 副標                        │   頁首不放 app 名稱、logo、emoji
│ ┌──────────────────────┐ │
│ │ 摘要卡片               │ │ ← UI.card
│ └──────────────────────┘ │
│ 區塊標題          右側資訊 │ ← UI.section / sectionHead
│ ┌──────────────────────┐ │
│ │ 清單列          數值    │ │ ← UI.listCard ＋ UI.row，列間 UI.divider
│ │ 清單列          數值    │ │
│ │ ＋ 加入…               │ │ ← UI.addRow
│ └──────────────────────┘ │
│                      (＋) │ ← UI.fab（右下）
├──────────────────────────┤
│  分頁   分頁   分頁   分頁  │ ← BottomTabs
└──────────────────────────┘
```

- 內頁（表單、管理頁）：`UI.subBar`（左邊返回圓鈕＋標題），右邊可放動作。
- 覆蓋畫面 / 底部面板要接 `useBackClose`，手機返回鍵先關面板、不會直接離開 app。

## 7. 可及性（硬規定）

- 文字對比 ≥4.5:1，實心色底上的白字 ≥4.5:1（淺色、深色都要）——`themeContrast.test.js` 會擋。
- 觸控範圍 ≥44px：視覺上比較小的按鈕加 `className="tap"`。
- 可點的東西一律 `<button>` / `<a href>`，不要 `<div onClick>`。
- icon-only 按鈕要有 `aria-label`；每個輸入框要有 `aria-label` 或 `<label>`。
- 不要寫 `outline: 'none'`（會蓋掉 `base.css` 的焦點環）。
- 顏色不是唯一的資訊來源：超標、選中等狀態要搭配文字、粗細或圖示。
- 尊重「減少動態效果」（`base.css` 已處理）。

## 8. 守門測試

`npm test`（根目錄）會跑：

| 測試 | 檢查什麼 | 失敗時 |
|---|---|---|
| `packages/shared/src/themeContrast.test.js` | 三個 app 的 `theme.css`（淺色＋深色）：文字類色票在 bg / surface / surface-alt 上 ≥4.5:1；`*-ink` 在對應淡底上 ≥4.5:1；白字在 primary / info / danger 上 ≥4.5:1 | 會列出哪一對顏色、對比多少；把文字調深或底色調淡 |
| `packages/shared/src/designScale.test.js` | 元件 inline style 的字級、字重、圓角只能用規格內的值 | 改成規格內最接近的值；真的要新增一級，先改測試和本文件 |

## 9. 常見工作流程

### 改某個 app 的顏色

1. 只改該 app 的 `src/theme.css`（淺色和 `@media (prefers-color-scheme:dark)` 兩區都要看）。
2. 改主色的話，`OtherApps.jsx` 裡該 app 的 `color` 也要改。
3. `npm test` 通過對比度檢查。
4. `npm run build -w <app>`。
5. 更新本文件第 2.2 節的色票表＋該 app 的 README / ARCHITECTURE。

### 改元件外觀（三個 app 一起變）

1. 改 `packages/shared/src/ui.js`（或對應的 shared 元件）。
2. `npm test`（字級 / 圓角 / 字重規格）＋三個 app 都 build。
3. 有改到規格就更新本文件第 3–5 節。

### 新增第四個 app

1. 照 [`new-app-sop.md`](./new-app-sop.md) 建 app。
2. 挑一個跟現有三個（綠 / 咖啡 / 藍）明顯不同色相的主色，照第 2.5 節推出整組中性色；語意色整組照抄。
3. 把新 app 加進 `themeContrast.test.js` 的 `APPS` 和 `designScale.test.js` 的 `DIRS`。
4. 在 `OtherApps.jsx` 加一筆，本文件第 2.2 節加一張色票表。

## 10. 要做 / 不要做

| 要做 | 不要做 |
|---|---|
| `color: 'var(--text-muted)'` | `color: '#666'`（寫死色碼） |
| 字色用 `var(--primary-ink)` | 字色用 `var(--primary)`（深色模式看不見） |
| 卡片用 `UI.card`（1px 邊線） | 卡片加 `boxShadow` 陰影 |
| 用 `UI.btnPrimary`、`UI.chip(on)` 這些共用樣式 | 在元件裡重新畫一個長得差不多的按鈕 |
| 一個畫面一顆實心主按鈕 | 一排好幾顆實心主色按鈕 |
| 用 `Icon.jsx` 的線條 icon | 用 emoji 或 ✏ × ▲ ▼ 當圖示 |
| 字級 13、15、18 | 字級 13.5、17、20、22 |
| 用 `toast()` / `confirmDialog()` | 用原生 `alert()` / `confirm()` |
| 語意色只表達語意（danger = 刪除 / 超標） | 拿 danger 紅當裝飾 |
