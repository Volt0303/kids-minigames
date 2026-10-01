import { describe, expect, it } from 'vitest';
import { headerColumns } from './headerLayout';
import { rect } from './rect';

const content = { title: 700, howTo: 520, progress: 800 };

describe('headerColumns', () => {
  it('orders the areas title, how-to, progress without overlap, inside the bar', () => {
    const bar = rect(12, 12, 3816, 156);
    const { title, howTo, progress } = headerColumns(bar, 12, 16, content);
    expect(title.x).toBeCloseTo(24);
    expect(howTo.x).toBeGreaterThan(title.x + title.width);
    expect(progress.x).toBeGreaterThan(howTo.x + howTo.width);
    expect(progress.x + progress.width).toBeCloseTo(bar.x + bar.width - 12);
  });

  it('keeps full size and shares spare width when there is room', () => {
    const { title, howTo, progress, scale } = headerColumns(rect(0, 0, 3840, 156), 12, 16, content);
    expect(scale).toBe(1);
    expect(title.width).toBeGreaterThan(content.title);
    expect(howTo.width).toBeGreaterThan(content.howTo);
    expect(progress.width).toBeGreaterThanOrEqual(content.progress);
  });

  it('shrinks every area by the same factor on a narrow screen', () => {
    const { title, howTo, progress, scale } = headerColumns(rect(0, 0, 1704, 156), 12, 16, content);
    expect(scale).toBeLessThan(1);
    expect(title.width / content.title).toBeCloseTo(scale);
    expect(howTo.width / content.howTo).toBeCloseTo(scale);
    expect(progress.width / content.progress).toBeCloseTo(scale);
  });

  it('rejects empty contents', () => {
    expect(() => headerColumns(rect(0, 0, 100, 100), 0, 0, { title: 0, howTo: 0, progress: 0 })).toThrow(RangeError);
  });
});
