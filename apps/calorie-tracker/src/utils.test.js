import { describe, expect, it } from 'vitest';
import { readableOn } from './utils.js';

describe('readableOn', () => {
  it('淺色底用深字', () => {
    expect(readableOn('#E8A13C')).toBe('#111');
    expect(readableOn('#5FA8D3')).toBe('#111');
    expect(readableOn('#EAB308')).toBe('#111');
  });
  it('深色底用白字', () => {
    expect(readableOn('#257A50')).toBe('#fff');
    expect(readableOn('#3A55D8')).toBe('#fff');
  });
  it('CSS 變數與空值一律白字', () => {
    expect(readableOn('var(--primary)')).toBe('#fff');
    expect(readableOn(undefined)).toBe('#fff');
  });
});
