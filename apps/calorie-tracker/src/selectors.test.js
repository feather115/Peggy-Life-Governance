import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildFoodHistory, computeLeaderboard, computeStreak, dayTotals, lastFriday, memberColor, MEMBER_PALETTE, ringInfo,
} from './selectors.js';

const item = (name, cal, extra = {}) => ({ id: `${name}-${cal}`, name, cal, p: 0, c: 0, f: 0, ...extra });
const day = (meals) => ({ meals: { breakfast: [], lunch: [], dinner: [], snack: [], midnight: [], ...meals } });

afterEach(() => { vi.useRealTimers(); });

describe('dayTotals', () => {
  it('加總五餐的熱量與營養素（字串數字也要能加）', () => {
    const d = day({ breakfast: [item('蛋', 78, { p: 6, c: 1, f: 5 })], midnight: [item('泡麵', '350', { p: '8' })] });
    expect(dayTotals(d)).toEqual({ cal: 428, p: 14, c: 1, f: 5 });
  });

  it('沒有紀錄的日子回傳 0', () => {
    expect(dayTotals(undefined)).toEqual({ cal: 0, p: 0, c: 0, f: 0 });
  });
});

describe('ringInfo', () => {
  it('依達成比例切換顏色與文字', () => {
    expect(ringInfo(1000, 1500).remainText).toBe('還可以吃 500 kcal');
    expect(ringInfo(1500, 1500).remainText).toBe('剩下 0 kcal');
    expect(ringInfo(1600, 1500).remainText).toBe('已超過 100 kcal');
  });
});

describe('computeStreak', () => {
  it('從今天往回數「有紀錄且沒超標」的連續天數', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 30, 12));
    const days = {
      '2026-09-30': day({ lunch: [item('便當', 700)] }),
      '2026-09-29': day({ lunch: [item('便當', 1400)] }),
      '2026-09-28': day({ lunch: [item('火鍋', 2000)] }),
      '2026-09-27': day({ lunch: [item('便當', 700)] }),
    };
    expect(computeStreak(days, 1500)).toBe(2);
  });

  it('今天還沒記錄就是 0', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 30, 12));
    expect(computeStreak({ '2026-09-29': day({ lunch: [item('便當', 700)] }) }, 1500)).toBe(0);
  });
});

describe('buildFoodHistory', () => {
  it('名稱忽略大小寫與前後空白合併，lastDate 取最近一次', () => {
    const days = {
      '2026-09-29': day({ breakfast: [item('Egg ', 78)] }),
      '2026-09-01': day({ dinner: [item('egg', 78)], snack: [item('蘋果', 50)] }),
    };
    const egg = buildFoodHistory(days).find((g) => g.name.trim().toLowerCase() === 'egg');
    expect(egg.count).toBe(2);
    expect(egg.lastDate).toBe('2026-09-29');
    expect(egg.byMeal).toEqual({ breakfast: 1, dinner: 1 });
    expect(egg.totalCal).toBe(156);
  });
});

describe('computeLeaderboard', () => {
  const challenge = {
    members: [
      { userId: 'a', name: 'A', joinedAt: '2026-09-01T00:00:00Z' },
      { userId: 'b', name: 'B', joinedAt: '2026-09-02T00:00:00Z' },
      { userId: 'c', name: 'C', joinedAt: '2026-09-03T00:00:00Z' },
    ],
    entries: [
      { userId: 'a', kgDiff: -1, weekLabel: '2026-09-18', recordedAt: '2026-09-18T01:00:00Z' },
      { userId: 'a', kgDiff: -2.5, weekLabel: '2026-09-25', recordedAt: '2026-09-25T01:00:00Z' },
      { userId: 'b', kgDiff: -1.8, weekLabel: '2026-09-25', recordedAt: '2026-09-25T02:00:00Z' },
    ],
  };

  it('以最新一週的 kgDiff 由小到大排名，沒登記的排最後', () => {
    const lb = computeLeaderboard(challenge, 'b');
    expect(lb.map((r) => [r.userId, r.rank, r.kgDiff])).toEqual([['a', 1, -2.5], ['b', 2, -1.8], ['c', 3, null]]);
    expect(lb[0].weeklyChange).toBeCloseTo(-1.5);
    expect(lb.find((r) => r.isMe).userId).toBe('b');
  });

  it('成員顏色：自訂色優先，否則依加入順序取色盤', () => {
    const withColor = { ...challenge, members: challenge.members.map((m) => (m.userId === 'c' ? { ...m, color: '#123456' } : m)) };
    expect(memberColor(withColor, 'c')).toBe('#123456');
    expect(memberColor(withColor, 'b')).toBe(MEMBER_PALETTE[1]);
  });
});

describe('lastFriday', () => {
  it('回傳最近一個週五（當天是週五就回傳當天）', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 30, 12)); // 週三
    expect(lastFriday()).toBe('2026-09-25');
    vi.setSystemTime(new Date(2026, 8, 25, 12)); // 週五
    expect(lastFriday()).toBe('2026-09-25');
    vi.setSystemTime(new Date(2026, 8, 26, 12)); // 週六
    expect(lastFriday()).toBe('2026-09-25');
  });
});
