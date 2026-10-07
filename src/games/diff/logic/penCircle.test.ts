import { describe, expect, it } from 'vitest';
import { PEN_CIRCLE, PEN_CIRCLE_LENGTH, starPoints } from './penCircle';

const point = (i: number): [number, number] => [PEN_CIRCLE[i * 2] ?? NaN, PEN_CIRCLE[i * 2 + 1] ?? NaN];

describe('PEN_CIRCLE', () => {
  it('is one smooth stroke close to radius 1', () => {
    for (let i = 0; i < PEN_CIRCLE_LENGTH; i++) {
      const [x, y] = point(i);
      expect(Math.hypot(x, y)).toBeGreaterThan(0.9);
      expect(Math.hypot(x, y)).toBeLessThan(1.05);
      if (i > 0) {
        const [px, py] = point(i - 1);
        expect(Math.hypot(x - px, y - py)).toBeLessThan(0.08);
      }
    }
  });

  it('closes: the end runs past the start, just inside it', () => {
    const [sx, sy] = point(0);
    const [ex, ey] = point(PEN_CIRCLE_LENGTH - 1);
    expect(Math.hypot(ex, ey)).toBeLessThan(Math.hypot(sx, sy));
    expect(Math.atan2(ey, ex)).not.toBeCloseTo(Math.atan2(sy, sx));
  });
});

describe('starPoints', () => {
  it('alternates tips on radius 1 and inner corners', () => {
    const points = starPoints(4, 0.3);
    expect(points).toHaveLength(16);
    for (let i = 0; i < 8; i++) {
      expect(Math.hypot(points[i * 2] ?? 0, points[i * 2 + 1] ?? 0)).toBeCloseTo(i % 2 === 0 ? 1 : 0.3);
    }
  });
});
