// 三個 app 的 theme.css（淺色 + 深色）文字對比度檢查：文字類色票在底色上 ≥4.5:1（WCAG AA），
// 實心底色（primary / info / danger）上放白字也 ≥4.5:1。改色票後跑 npm test 就知道有沒有破。
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '../../..');
const APPS = ['calorie-tracker', 'recipe-book', 'calendar'];

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
function tokens(block) {
  return Object.fromEntries([...block.matchAll(/--([\w-]+):(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2]]));
}

const TEXT = ['text', 'text-muted', 'text-faint', 'primary-ink', 'info-ink', 'success-ink', 'danger-ink', 'warning-ink',
  'carb-ink', 'fat-ink', 'bronze-ink', 'cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-5'];
const SURFACES = ['surface', 'bg', 'surface-alt'];
const ON_TINT = [['primary-ink', 'primary-soft'], ['primary-strong', 'primary-soft'], ['info-ink', 'info-bg'], ['success-ink', 'success-bg'],
  ['danger-ink', 'danger-bg'], ['warning-ink', 'warning-bg'], ['like', 'like-bg'],
  ...[1, 2, 3, 4, 5].map((n) => [`cat-${n}`, 'primary-soft'])];
const FILLS = ['primary', 'info', 'danger'];

describe.each(APPS)('%s theme.css', (app) => {
  const css = readFileSync(join(ROOT, 'apps', app, 'src/theme.css'), 'utf8');
  const light = tokens(css.split('@media')[0]);
  const dark = { ...light, ...tokens(css.split('@media')[1] || '') };

  it.each([['淺色', light], ['深色', dark]])('%s模式文字對比 ≥4.5', (_, t) => {
    const fails = [];
    for (const fg of TEXT) for (const bg of SURFACES) {
      if (t[fg] && t[bg] && contrast(t[fg], t[bg]) < 4.5) fails.push(`${fg} on ${bg}: ${contrast(t[fg], t[bg]).toFixed(2)}`);
    }
    for (const [fg, bg] of ON_TINT) {
      if (t[fg] && t[bg] && contrast(t[fg], t[bg]) < 4.5) fails.push(`${fg} on ${bg}: ${contrast(t[fg], t[bg]).toFixed(2)}`);
    }
    for (const fill of FILLS) {
      if (t[fill] && contrast('#FFFFFF', t[fill]) < 4.5) fails.push(`white on ${fill}: ${contrast('#FFFFFF', t[fill]).toFixed(2)}`);
    }
    expect(fails).toEqual([]);
  });
});
