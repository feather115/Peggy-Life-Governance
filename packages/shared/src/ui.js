// 三個 app 共用的元件樣式（對應設計稿「共用元件」）：同一種東西只長一種樣子。
// 頁首、卡片、清單列、按鈕、膠囊、輸入框都從這裡拿，元件裡再用展開覆寫位置或寬度，例如
// { ...UI.btnPrimary, width: '100%' }。色值一律是 theme.css 的 CSS 變數（主色跟著各 app 換），
// 字級 / 圓角也都在 designScale.test.js 的規格內。要改外觀改這裡，三個 app 一起變。
//
// 使用原則：
//   - 實心主色按鈕（btnPrimary）一個畫面最多一顆；其他動作用 btnSecondary / btnNeutral / btnText
//   - 卡片用 1px 邊線（--shadow-card），不加陰影；浮在上層的東西（FAB、面板、提示）才用 --shadow-float
//   - 字重只用 400 / 500 / 600

const ROW_PAD = '12px 16px';

export const UI = {
  // 頁首：標題在左、動作在右；時間切換（‹ ›）固定放右側
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '20px 20px 8px' },
  title: { fontSize: 24, lineHeight: 1.25, fontWeight: 600, color: 'var(--text)', margin: 0 },
  subtitle: { fontSize: 13, lineHeight: 1.4, color: 'var(--text-muted)', margin: '4px 0 0', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  headerActions: { display: 'flex', alignItems: 'center', gap: 8, flex: 'none' },
  // 內頁（表單、管理頁）頂列：左邊返回圓鈕（UI.iconBtn）＋ 標題，右邊可放動作
  subBar: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px 8px' },
  subTitle: { flex: 1, minWidth: 0, margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text)' },

  // 區塊：卡片外的標題（「早餐」「食材」），設定頁的分組小標
  section: { margin: '28px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 },
  sectionHead: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, padding: '0 4px' },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: 0 },
  groupLabel: { fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', margin: 0, padding: '0 4px' },

  // 卡片與清單
  card: { background: 'var(--surface)', borderRadius: 14, boxShadow: 'var(--shadow-card)' },
  listCard: { background: 'var(--surface)', borderRadius: 14, boxShadow: 'var(--shadow-card)', overflow: 'hidden' },
  row: { width: '100%', minHeight: 56, display: 'flex', alignItems: 'center', gap: 12, padding: ROW_PAD, border: 'none', background: 'none', color: 'var(--text)', textAlign: 'left' },
  rowText: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: 500, color: 'var(--text)' },
  rowMeta: { fontSize: 13, color: 'var(--text-muted)' },
  rowValue: { fontSize: 15, fontWeight: 500, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', flex: 'none' },
  divider: { height: 1, background: 'var(--line)', marginLeft: 16 },
  // 清單尾端的「＋ 加入…」列
  addRow: { width: '100%', minHeight: 48, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', border: 'none', borderTop: '1px solid var(--line)', background: 'none', color: 'var(--primary-ink)', fontSize: 15, fontWeight: 500, textAlign: 'left' },
  empty: { fontSize: 13, color: 'var(--text-faint)', padding: '12px 16px' },

  // 按鈕
  btnPrimary: { minHeight: 48, padding: '0 20px', border: 'none', borderRadius: 10, background: 'var(--primary)', color: 'var(--on-primary)', fontSize: 15, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  btnSecondary: { minHeight: 40, padding: '0 14px', border: 'none', borderRadius: 10, background: 'var(--primary-soft)', color: 'var(--primary-ink)', fontSize: 14, fontWeight: 500, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, whiteSpace: 'nowrap' },
  btnNeutral: { minHeight: 40, padding: '0 14px', border: 'none', borderRadius: 10, background: 'var(--sunken)', color: 'var(--text)', fontSize: 14, fontWeight: 500, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, whiteSpace: 'nowrap' },
  btnText: { minHeight: 40, padding: '0 8px', border: 'none', background: 'none', color: 'var(--primary-ink)', fontSize: 14, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' },
  btnDanger: { minHeight: 40, padding: '0 14px', border: 'none', borderRadius: 10, background: 'var(--danger)', color: 'var(--on-primary)', fontSize: 14, fontWeight: 500, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, whiteSpace: 'nowrap' },
  btnDangerText: { minHeight: 40, padding: '0 8px', border: 'none', background: 'none', color: 'var(--danger-ink)', fontSize: 14, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' },

  // 圓鈕：外框（導覽 ‹ ›、返回）/ 底色（關閉 ×）/ 淡主色（加入 ＋）/ 浮動新增（FAB）
  iconBtn: { width: 40, height: 40, padding: 0, flex: 'none', borderRadius: 999, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--text)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  iconBtnPlain: { width: 40, height: 40, padding: 0, flex: 'none', borderRadius: 999, border: 'none', background: 'var(--sunken)', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  iconBtnSoft: { width: 36, height: 36, padding: 0, flex: 'none', borderRadius: 999, border: 'none', background: 'var(--primary-soft)', color: 'var(--primary-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', right: 20, bottom: 'calc(84px + env(safe-area-inset-bottom))', zIndex: 5, width: 56, height: 56, padding: 0, border: 'none', borderRadius: 999, background: 'var(--primary)', color: 'var(--on-primary)', boxShadow: 'var(--shadow-float)', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  // 膠囊（可點的篩選 / 單選）：選中是淡主色，沒選是外框
  chip: (on) => ({
    minHeight: 32, padding: '0 14px', borderRadius: 999, flexShrink: 0, whiteSpace: 'nowrap',
    border: on ? '1px solid transparent' : '1px solid var(--line-strong)',
    background: on ? 'var(--primary-soft)' : 'transparent',
    color: on ? 'var(--primary-ink)' : 'var(--text-muted)',
    fontSize: 14, fontWeight: 500, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
  }),
  chipRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  // 分段切換（同一塊內容換檢視）
  segTrack: { display: 'flex', gap: 4, padding: 4, borderRadius: 999, background: 'var(--sunken)' },
  seg: (on) => ({
    flex: 1, minHeight: 32, padding: '0 12px', border: 'none', borderRadius: 999, whiteSpace: 'nowrap',
    background: on ? 'var(--surface)' : 'transparent', boxShadow: on ? '0 1px 2px rgba(0,0,0,.12)' : 'none',
    color: on ? 'var(--text)' : 'var(--text-muted)', fontSize: 14, fontWeight: on ? 600 : 500,
  }),
  // 標籤（不能點的狀態標示）：tone = primary | neutral | info | warning | danger | success
  tag: (tone = 'neutral') => ({
    display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, lineHeight: 1.5,
    padding: '1px 8px', borderRadius: 999, whiteSpace: 'nowrap',
    color: tone === 'neutral' ? 'var(--text-muted)' : `var(--${tone}-ink)`,
    background: tone === 'neutral' ? 'var(--sunken)' : tone === 'primary' ? 'var(--primary-soft)' : `var(--${tone}-bg)`,
  }),

  // 輸入框（外框白底）與欄位標籤
  input: { width: '100%', minHeight: 44, padding: '0 12px', border: '1px solid var(--line-strong)', borderRadius: 10, background: 'var(--surface)', color: 'var(--text)', fontSize: 15 },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid var(--line-strong)', borderRadius: 10, background: 'var(--surface)', color: 'var(--text)', fontSize: 15, lineHeight: 1.6, resize: 'vertical' },
  fieldLabel: { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 },
  fieldError: { fontSize: 13, color: 'var(--danger-ink)', marginTop: 6 },
  // 份數 ＋ − 膠囊
  stepper: { minHeight: 32, display: 'inline-flex', alignItems: 'center', flex: 'none', border: '1px solid var(--line-strong)', borderRadius: 999 },
  stepperBtn: { width: 32, height: 30, padding: 0, border: 'none', background: 'none', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  stepperInput: { width: 36, padding: 0, border: 'none', background: 'none', color: 'var(--text)', textAlign: 'center', fontSize: 15, fontWeight: 500, fontVariantNumeric: 'tabular-nums' },

  // 提示條（卡片內的一行說明）
  note: (tone = 'primary') => ({
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, fontSize: 13, fontWeight: 500, lineHeight: 1.5,
    color: tone === 'primary' ? 'var(--primary-ink)' : `var(--${tone}-ink)`,
    background: tone === 'primary' ? 'var(--primary-soft)' : `var(--${tone}-bg)`,
  }),
  num: { fontVariantNumeric: 'tabular-nums' },
};
