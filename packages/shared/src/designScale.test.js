// 守住三個 app 共用的尺寸規格：inline style 裡的字級、字重與圓角只能用下面這些值。
// 要新增一級請先改這裡並更新 docs/new-app-sop.md 的「樣式慣例」，不要在元件裡隨手寫 13.5、17、22 這種值。
// 2026-09-30 改版收斂：字級拿掉 20、圓角拿掉 8 與 28、字重只留 400/500/600（元件樣式的共用來源是 shared/src/ui.js）。
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const FONT_SIZES = [12, 13, 14, 15, 16, 18, 24];
const DISPLAY_MIN = 28; // 28 以上是大數字（卡路里環、統計數字），不受限
const RADII = [10, 14, 20, 999];
const MICRO_RADIUS_MAX = 5; // 進度條、小圓點這類細節
const FONT_WEIGHTS = [400, 500, 600];

const ROOT = join(import.meta.dirname, '../../..');
const DIRS = ['apps/calorie-tracker/src', 'apps/recipe-book/src', 'apps/calendar/src', 'packages/shared/src'];

function jsxFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return jsxFiles(p);
    return /\.jsx$|theme\.js$|ui\.js$/.test(name) && !name.startsWith('__') ? [p] : [];
  });
}

describe('design scale', () => {
  const files = DIRS.flatMap((d) => jsxFiles(join(ROOT, d)));

  it('字級只用規格內的值', () => {
    const bad = files.flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/fontSize: ?(\d+(?:\.\d+)?)(?![\d.])/g)]
      .map((m) => Number(m[1]))
      .filter((v) => v < DISPLAY_MIN && !FONT_SIZES.includes(v))
      .map((v) => `${f.replace(ROOT, '')}: fontSize ${v}`));
    expect(bad).toEqual([]);
  });

  it('字重只用 400 / 500 / 600', () => {
    const bad = files.flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/fontWeight: ?'?(\d+)/g)]
      .map((m) => Number(m[1]))
      .filter((v) => !FONT_WEIGHTS.includes(v))
      .map((v) => `${f.replace(ROOT, '')}: fontWeight ${v}`));
    expect(bad).toEqual([]);
  });

  it('圓角只用規格內的值', () => {
    const bad = files.flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/(?:borderRadius|radius(?:Sm|SmInner)?): ?(\d+)(?![\d%]|px)/g)]
      .map((m) => Number(m[1]))
      .filter((v) => v > MICRO_RADIUS_MAX && !RADII.includes(v))
      .map((v) => `${f.replace(ROOT, '')}: radius ${v}`));
    expect(bad).toEqual([]);
  });
});
