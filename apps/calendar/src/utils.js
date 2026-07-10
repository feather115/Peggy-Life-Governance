// ============================================================
//  純工具函式：日期運算、月/週格線、事件分組
//  沒有 React、沒有 Supabase 依賴，可隨意 import
// ============================================================

export const DOW = ['日', '一', '二', '三', '四', '五', '六'];

export function dateKeyFrom(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function todayKey() {
  return dateKeyFrom(new Date());
}

export function monthLabel(year, monthIndex) {
  return `${year} 年 ${monthIndex + 1} 月`;
}

// 月曆格線：前後補 null 讓每列剛好 7 天
export function getMonthDays(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(dateKeyFrom(new Date(year, monthIndex, day)));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// 輸入任一天，回傳該週（週日開始）的 7 個 dateKey
export function getWeekDays(date) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return dateKeyFrom(d);
  });
}

export function weekRangeLabel(dateKeys) {
  const first = parseDateKey(dateKeys[0]);
  const last = parseDateKey(dateKeys[dateKeys.length - 1]);
  const fmt = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmt(first)} – ${fmt(last)}`;
}

export function dayLabel(dateKey) {
  const d = parseDateKey(dateKey);
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日（${DOW[d.getDay()]}）`;
}

export function formatTime(isoString) {
  const d = new Date(isoString);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// 把事件依 start_at 換算成「本地日期」分組成 { dateKey: [events...] }，組內依開始時間排序
export function groupEventsByDate(events) {
  const map = {};
  events.forEach((ev) => {
    const key = dateKeyFrom(new Date(ev.start_at));
    if (!map[key]) map[key] = [];
    map[key].push(ev);
  });
  Object.values(map).forEach((list) => list.sort((a, b) => new Date(a.start_at) - new Date(b.start_at)));
  return map;
}

// <input type="datetime-local"> 用的字串格式（本地時間，無時區），YYYY-MM-DDTHH:mm
export function toDatetimeLocalValue(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 從 <input type="datetime-local"> 的字串轉回 ISO（帶時區），存進 DB 前用
export function fromDatetimeLocalValue(value) {
  if (!value) return null;
  return new Date(value).toISOString();
}

// 把日記依 entry_date 分組成 { dateKey: [entries...] }，組內全天優先、其餘依時間排序
export function groupDiaryByDate(entries) {
  const map = {};
  entries.forEach((e) => {
    if (!map[e.entry_date]) map[e.entry_date] = [];
    map[e.entry_date].push(e);
  });
  Object.values(map).forEach((list) => list.sort((a, b) => {
    if (!!a.all_day !== !!b.all_day) return a.all_day ? -1 : 1;
    return (a.time || '').localeCompare(b.time || '');
  }));
  return map;
}

export function formatDiaryTime(entry) {
  if (entry.all_day) return '全天';
  if (entry.end_time) return `${entry.time || '--:--'}–${entry.end_time}`;
  return entry.time || '--:--';
}

// 合併事件 + 日記 + 當天到期任務成一條時間軸（全天/任務在前，其餘依時間排序），Day/Week/Month 共用
export function buildDayTimeline(dateEvents, dateDiaryEntries, dateTasks) {
  const eventItems = (dateEvents || []).map((ev) => ({
    kind: 'event', id: ev.id, data: ev,
    isAllDay: !!ev.all_day,
    // start_at 是 UTC 字串，直接 slice 會拿到 UTC 時間、跟日記的本地時間字串排在一起會錯位
    sortKey: ev.all_day ? '' : formatTime(ev.start_at),
  }));
  const diaryItems = (dateDiaryEntries || []).map((entry) => ({
    kind: 'diary', id: entry.id, data: entry,
    isAllDay: !!entry.all_day,
    sortKey: entry.all_day ? '' : (entry.time || '00:00'),
  }));
  const taskItems = (dateTasks || []).map((t) => ({
    kind: 'task', id: t.id, data: t,
    isAllDay: true, // 任務沒有時間概念，一律當全天項目排最前面
    sortKey: '',
  }));
  const all = [...taskItems, ...eventItems, ...diaryItems];
  const allDay = all.filter((it) => it.isAllDay);
  const timed = all.filter((it) => !it.isAllDay).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  return [...allDay, ...timed];
}

// ---- 週期性任務用的日期運算 ----

export const INTERVAL_UNIT_LABEL = { day: '天', week: '週', month: '個月' };

function addDaysToKey(dateKey, n) {
  const d = parseDateKey(dateKey);
  d.setDate(d.getDate() + n);
  return dateKeyFrom(d);
}

// 依間隔單位把 dateKey 往後推 value 個單位，算出下次到期日
export function addInterval(dateKey, value, unit) {
  if (unit === 'day') return addDaysToKey(dateKey, value);
  if (unit === 'week') return addDaysToKey(dateKey, value * 7);
  const d = parseDateKey(dateKey);
  d.setMonth(d.getMonth() + value);
  return dateKeyFrom(d);
}

// a - b 的天數差（a 比 b 晚幾天，可能是負數）
export function diffDays(a, b) {
  return Math.round((parseDateKey(a) - parseDateKey(b)) / 86400000);
}
