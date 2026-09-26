import { describe, expect, it } from 'vitest';
import { center, fitContain, inset, rect, split } from './rect';

describe('inset', () => {
  it('shrinks on every side', () => {
    expect(inset(rect(0, 0, 100, 50), 10)).toEqual(rect(10, 10, 80, 30));
  });

  it('never produces a negative size', () => {
    expect(inset(rect(0, 0, 20, 10), 50)).toEqual(rect(10, 5, 0, 0));
  });
});

describe('split', () => {
  const screen = rect(0, 0, 3840, 1080);

  it('splits side by side by weight (puzzle board and tray on the wide screen)', () => {
    const [board, tray] = split(screen, 'horizontal', [2, 1]);
    expect(board).toEqual(rect(0, 0, 2560, 1080));
    expect(tray).toEqual(rect(2560, 0, 1280, 1080));
  });

  it('stacks vertically and leaves gaps between parts', () => {
    const parts = split(rect(0, 0, 100, 220), 'vertical', [1, 1], 20);
    expect(parts).toEqual([rect(0, 0, 100, 100), rect(0, 120, 100, 100)]);
  });

  it('returns nothing for no weights', () => {
    expect(split(screen, 'horizontal', [])).toEqual([]);
  });

  it.each([[[1, 0]], [[1, -2]], [[Number.NaN]]])('rejects invalid weights %j', (weights) => {
    expect(() => split(screen, 'horizontal', weights)).toThrow(RangeError);
  });
});

describe('fitContain', () => {
  it('scales content to the limiting side and centres it', () => {
    expect(fitContain(1200, 800, rect(0, 0, 600, 600))).toEqual({ x: 300, y: 300, scale: 0.5 });
  });

  it('rejects empty content', () => {
    expect(() => fitContain(0, 10, rect(0, 0, 10, 10))).toThrow(RangeError);
  });
});

describe('center', () => {
  it('returns the middle point', () => {
    expect(center(rect(10, 20, 100, 40))).toEqual({ x: 60, y: 40 });
  });
});
