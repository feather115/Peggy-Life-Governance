// ============================================================
//  純計算函式（selectors）：把原始 days 資料算成「畫面要顯示的數字」
//  報表頁、卡路里環、連續達標天數的數學都在這裡
//  改「計算邏輯/門檻顏色」就改這裡，不用碰元件
// ============================================================

import { MEALS_DEF, DOW } from './constants.js';
import { dkFrom, todayKey } from './utils.js';

// 單日總熱量與三大營養素（meal_items 已是快照，直接加總即可）
export function dayTotals(day) {
  let cal = 0, p = 0, c = 0, f = 0;
  if (day?.meals) {
    MEALS_DEF.forEach((m) => {
      (day.meals[m.key] || []).forEach((it) => {
        cal += Number(it.cal) || 0;
        p += Number(it.p) || 0;
        c += Number(it.c) || 0;
        f += Number(it.f) || 0;
      });
    });
  }
  return { cal, p, c, f };
}

// 卡路里環的顏色 / 剩餘文字（依達成比例變綠/橘/紅）
export function ringInfo(consumed, goalCal) {
  const diff = goalCal - consumed;
  const ratio = consumed / (goalCal || 1);
  if (ratio > 1) {
    return { diff, ringColor: '#D9544F', remainColor: '#fff', remainBg: '#D9544F', remainText: `已超過 ${Math.abs(diff)} kcal` };
  }
  if (ratio > 0.9) {
    return { diff, ringColor: '#E8A13C', remainColor: '#8B5A00', remainBg: '#FFF1D6', remainText: `剩下 ${diff} kcal` };
  }
  return { diff, ringColor: '#2E8B5E', remainColor: '#2E8B5E', remainBg: '#EAF5EE', remainText: `還可以吃 ${diff} kcal` };
}

// 報表 - 本週長條圖（過去 7 天）
export function buildWeek(days, goalCal, fastingIds, otherIds) {
  const weekDays = [];
  for (let i = 6; i >= 0; i--) {
    const wd = new Date(); wd.setDate(wd.getDate() - i);
    const wdk = dkFrom(wd);
    const wt = dayTotals(days[wdk]);
    const wAT = days[wdk]?.tags?.activeTags || [];
    weekDays.push({
      dk: wdk, cal: Math.round(wt.cal), dow: DOW[wd.getDay()], isToday: wdk === todayKey(),
      hasFast: wAT.some((t) => fastingIds.includes(t)),
      hasOther: wAT.some((t) => otherIds.includes(t)),
    });
  }
  const maxBC = Math.max(goalCal * 1.15, Math.max(...weekDays.map((d) => d.cal), 1));
  const chartH = 120;
  const glb = Math.round((goalCal / maxBC) * chartH);
  const weekBars = weekDays.map((d) => {
    const bh = d.cal > 0 ? Math.max(6, Math.round((d.cal / maxBC) * chartH)) : 6;
    const bc = d.cal === 0 ? '#E0E5E2' : d.cal <= goalCal ? '#2E8B5E' : d.cal <= goalCal * 1.1 ? '#E8A13C' : '#D9544F';
    return {
      cal: d.cal > 0 ? d.cal : '', height: bh + 'px', color: bc, label: d.dow,
      labelColor: d.isToday ? '#234034' : '#9bb0a3', labelWeight: d.isToday ? '900' : '700',
      calColor: d.cal > goalCal ? '#D9544F' : '#6E8B7C', hasFast: d.hasFast,
    };
  });
  const wRec = weekDays.filter((d) => d.cal > 0);
  const wAvg = wRec.length > 0 ? Math.round(wRec.reduce((s, d) => s + d.cal, 0) / wRec.length) : 0;
  const wUnder = wRec.filter((d) => d.cal <= goalCal).length;
  return { weekBars, glb, wAvg, wUnder };
}

// 報表 - 指定月份月曆熱力圖 + 月統計 + 營養素比例
export function buildMonth(days, goalCal, fastingIds, otherTagDefs, monthDate = new Date()) {
  const today = todayKey();
  const otherTags = otherTagDefs.map((t) => (typeof t === 'string' ? { id: t, color: '#E8A13C' } : { id: t.id, color: t.color || '#E8A13C' }));
  const otherIds = otherTags.map((t) => t.id);
  const mY = monthDate.getFullYear(), mM = monthDate.getMonth();
  const dim = new Date(mY, mM + 1, 0).getDate();
  const fDow = new Date(mY, mM, 1).getDay();
  const mLabel = `${mY}年${mM + 1}月`;
  const calCells = [];
  for (let pad = 0; pad < fDow; pad++) calCells.push({ empty: true });
  let mTotalCal = 0, mRecD = 0, mFastD = 0, mOtherD = 0, mTP = 0, mTC = 0, mTF = 0;
  for (let md = 1; md <= dim; md++) {
    const mdk = dkFrom(new Date(mY, mM, md));
    const mt = dayTotals(days[mdk]);
    const mc = Math.round(mt.cal);
    const isFut = mdk > today;
    let bg = isFut ? '#F8FAF8' : '#F0F3F1';
    if (!isFut && mc > 0) {
      mTotalCal += mc; mRecD++; mTP += mt.p; mTC += mt.c; mTF += mt.f;
      bg = mc <= goalCal ? '#DCEDE3' : mc <= goalCal * 1.1 ? '#FEEFC3' : '#FECACA';
    }
    const mAT = days[mdk]?.tags?.activeTags || [];
    const mHF = mAT.some((t) => fastingIds.includes(t));
    const otherColors = otherTags.filter((t) => mAT.includes(t.id)).map((t) => t.color);
    const mHO = otherColors.length > 0;
    if (!isFut && mHF) mFastD++;
    if (!isFut && mHO) mOtherD++;
    const isCur = mdk === today;
    calCells.push({
      empty: false, day: md, dateKey: mdk, isFuture: isFut, bg, hasFast: mHF, hasOther: mHO, otherColors,
      todayBorder: isCur ? '2px solid #2E8B5E' : '2px solid transparent',
      textColor: isFut ? '#C5CCC7' : '#234034',
    });
  }
  const mAvg = mRecD > 0 ? Math.round(mTotalCal / mRecD) : 0;
  const tmG = mTP + mTC + mTF;
  const mpP = tmG > 0 ? Math.round((mTP / tmG) * 100) : 33;
  const mpC = tmG > 0 ? Math.round((mTC / tmG) * 100) : 34;
  const mpF = 100 - mpP - mpC;
  return { mLabel, calCells, mAvg, mRecD, mFastD, mOtherD, mpP, mpC, mpF };
}

// 目前連續達標天數（從今天往回數，當日有記錄且 ≤ 目標）
export function computeStreak(days, goalCal) {
  let streak = 0;
  const sd = new Date();
  while (true) {
    const st = dayTotals(days[dkFrom(sd)]);
    if (st.cal > 0 && st.cal <= goalCal) { streak++; sd.setDate(sd.getDate() - 1); }
    else break;
  }
  return streak;
}

// 有實際吃東西的天數（資料管理頁顯示用）
export function totalRecordedDays(days) {
  return Object.keys(days).filter((k) => {
    const d = days[k];
    if (!d?.meals) return false;
    return MEALS_DEF.some((m) => (d.meals[m.key] || []).length > 0);
  }).length;
}

// 報表 - 飲食歷史索引：把所有日子吃過的東西依名稱（忽略大小寫/空白）彙整，
// 回傳 [{ name, count, lastDate, totalCal, byMeal:{mealKey:count}, entries:[{date,mealKey,item}] }]
// entries 的 item 帶完整欄位（id/brand/unit/cal/p/c/f），讓畫面可以直接編輯或複製那一筆
// 用於「搜尋某食物哪幾天吃過」
export function buildFoodHistory(days) {
  const map = {};
  Object.keys(days).sort().forEach((dk) => {
    const day = days[dk];
    if (!day?.meals) return;
    MEALS_DEF.forEach((m) => {
      (day.meals[m.key] || []).forEach((it) => {
        const key = (it.name || '').trim().toLowerCase();
        if (!key) return;
        if (!map[key]) map[key] = { name: it.name, count: 0, lastDate: dk, totalCal: 0, byMeal: {}, entries: [] };
        const g = map[key];
        g.count++;
        g.lastDate = dk; // 日期是遞增處理，最後寫入的就是最近一次
        g.totalCal += Number(it.cal) || 0;
        g.byMeal[m.key] = (g.byMeal[m.key] || 0) + 1;
        g.entries.push({ date: dk, mealKey: m.key, item: it });
      });
    });
  });
  return Object.values(map);
}

// 報表 - 某個餐別（早/午/晚/點心/宵夜）吃過的食物排行，依次數由多到少
// 回傳 [{ name, count, totalCal }]，用於「我早餐通常吃什麼」
export function mealTypeBreakdown(days, mealKey) {
  const map = {};
  Object.keys(days).forEach((dk) => {
    (days[dk]?.meals?.[mealKey] || []).forEach((it) => {
      const key = (it.name || '').trim().toLowerCase();
      if (!key) return;
      if (!map[key]) map[key] = { name: it.name, count: 0, totalCal: 0 };
      map[key].count++;
      map[key].totalCal += Number(it.cal) || 0;
    });
  });
  return Object.values(map).sort((a, b) => b.count - a.count);
}

// ═════════════════════════════════════════════════════════════
//  Weight Challenge selectors
// ═════════════════════════════════════════════════════════════

// 用 challenge 結束日算還剩幾天
export function daysLeft(endDate) {
  return Math.max(0, Math.ceil((new Date(endDate) - new Date()) / 86400000));
}

// 成員預設顏色盤（16 色，特意挑開色相差距夠大的顏色，避免多人選完還是分不出來）
const MEMBER_PALETTE = [
  '#2E8B5E', '#4361EE', '#E8A13C', '#5FA8D3',
  '#8B5CF6', '#EC4899', '#10B981', '#D9544F',
  '#F59E0B', '#0EA5E9', '#A855F7', '#84CC16',
  '#F43F5E', '#6366F1', '#14B8A6', '#EAB308',
];

// 依加入順序穩定排序成員（決定預設顏色的 index，避免每次渲染順序跳動）
function sortedMembers(challenge) {
  return [...challenge.members].sort((a, b) =>
    (a.joinedAt || '').localeCompare(b.joinedAt || '') || a.userId.localeCompare(b.userId));
}

// 取得某成員在這個挑戰裡的顏色：自訂優先，沒設就依加入順序從色盤分配（保證同挑戰內不撞色）
export function memberColor(challenge, userId) {
  const m = challenge.members.find(x => x.userId === userId);
  if (m?.color) return m.color;
  const idx = sortedMembers(challenge).findIndex(x => x.userId === userId);
  return MEMBER_PALETTE[idx % MEMBER_PALETTE.length] || '#9bb0a3';
}

export { MEMBER_PALETTE };

// 排行榜：每位成員「最新一筆 kg_diff」由小到大排序（越負代表瘦越多）
// 回傳：[{ userId, name, isMe, kgDiff(null=未登記), lastUpdated, rank, color }]
export function computeLeaderboard(challenge, myUserId) {
  if (!challenge) return [];
  const byUser = {};
  challenge.entries.forEach(e => {
    const cur = byUser[e.userId];
    // 用 week_label（代表哪一週）排序，不能用 recordedAt（寫入時間）—
    // 補登歷史資料時所有筆的寫入時間幾乎相同，會抓錯「最新一筆」
    if (!cur || e.weekLabel > cur.weekLabel) byUser[e.userId] = e;
  });
  const rows = challenge.members.map(m => {
    const latest = byUser[m.userId];
    return {
      userId: m.userId,
      name: m.name,
      color: memberColor(challenge, m.userId),
      isMe: m.userId === myUserId,
      kgDiff: latest ? Number(latest.kgDiff) : null,
      lastUpdated: latest ? latest.recordedAt : null,
    };
  });
  rows.sort((a, b) => {
    if (a.kgDiff === null && b.kgDiff === null) return 0;
    if (a.kgDiff === null) return 1;
    if (b.kgDiff === null) return -1;
    return a.kgDiff - b.kgDiff; // 越小（越負）越前面
  });
  rows.forEach((r, i) => { r.rank = i + 1; });
  return rows;
}

// 找自己的排名（找不到回 null）
export function myRankIn(leaderboard, myUserId) {
  const r = leaderboard.find(x => x.userId === myUserId);
  return r ? r.rank : null;
}

// 最近一個週五（包含今天若是週五）的 YYYY-MM-DD
export function lastFriday() {
  const d = new Date();
  const dw = d.getDay();
  d.setDate(d.getDate() - (dw === 5 ? 0 : (dw + 7 - 5) % 7));
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
