import { describe, expect, it } from 'vitest';
import { addInterval, buildDayTimeline, diffDays, getMonthDays, getWeekDays, groupRecordsByDate } from './utils.js';

// 用本地時間建 ISO 字串，測試結果不受執行環境時區影響
const at = (y, m, d, h = 0, min = 0) => new Date(y, m - 1, d, h, min).toISOString();

describe('groupRecordsByDate', () => {
  it('跨日行程出現在涵蓋的每一天，組內依開始時間排序', () => {
    const trip = { id: 'trip', start_at: at(2026, 9, 28, 22), end_at: at(2026, 9, 30, 1) };
    const lunch = { id: 'lunch', start_at: at(2026, 9, 29, 12), end_at: null };
    const map = groupRecordsByDate([lunch, trip]);
    expect(Object.keys(map).sort()).toEqual(['2026-09-28', '2026-09-29', '2026-09-30']);
    expect(map['2026-09-29'].map((r) => r.id)).toEqual(['trip', 'lunch']);
    expect(map['2026-09-30'].map((r) => r.id)).toEqual(['trip']);
  });

  it('結束時間早於開始時間的紀錄不會消失，歸在開始那天', () => {
    const broken = { id: 'x', start_at: at(2026, 9, 29, 10), end_at: at(2026, 9, 28, 9) };
    expect(groupRecordsByDate([broken])['2026-09-29'].map((r) => r.id)).toEqual(['x']);
  });
});

describe('buildDayTimeline', () => {
  it('任務與全天項目排最前，其餘依本地時間排序', () => {
    const records = [
      { id: 'dinner', start_at: at(2026, 9, 29, 19), all_day: false },
      { id: 'holiday', start_at: at(2026, 9, 29, 0), all_day: true },
      { id: 'breakfast', start_at: at(2026, 9, 29, 8), all_day: false },
    ];
    const tasks = [{ id: 'water-plants' }];
    expect(buildDayTimeline(records, tasks).map((it) => it.id)).toEqual(['water-plants', 'holiday', 'breakfast', 'dinner']);
  });
});

describe('週期任務日期運算', () => {
  it('addInterval 依天/週/月往後推', () => {
    expect(addInterval('2026-09-29', 3, 'day')).toBe('2026-10-02');
    expect(addInterval('2026-09-29', 2, 'week')).toBe('2026-10-13');
    expect(addInterval('2026-09-29', 1, 'month')).toBe('2026-10-29');
    expect(addInterval('2026-12-15', 1, 'month')).toBe('2027-01-15');
  });

  it('diffDays 回傳 a 比 b 晚幾天', () => {
    expect(diffDays('2026-10-01', '2026-09-29')).toBe(2);
    expect(diffDays('2026-09-29', '2026-10-01')).toBe(-2);
  });
});

describe('月/週格線', () => {
  it('getWeekDays 以週日開始', () => {
    expect(getWeekDays(new Date(2026, 8, 30))).toEqual([
      '2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03',
    ]);
  });

  it('getMonthDays 前後補 null 湊滿整週', () => {
    const cells = getMonthDays(2026, 8); // 2026 年 9 月，1 號是週二
    expect(cells.slice(0, 3)).toEqual([null, null, '2026-09-01']);
    expect(cells.length % 7).toBe(0);
    expect(cells.filter(Boolean)).toHaveLength(30);
  });
});
