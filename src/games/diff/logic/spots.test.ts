import { describe, expect, it } from 'vitest';
import { hitSpot } from './spots';

describe('hitSpot', () => {
  const all = [
    { x: 0.2, y: 0.2, radius: 0.1 },
    { x: 0.8, y: 0.8, radius: 0.1 },
  ];

  it('finds the difference under the tap', () => {
    expect(hitSpot({ x: 0.22, y: 0.18 }, all, new Set(), 1)).toBe(0);
    expect(hitSpot({ x: 0.8, y: 0.85 }, all, new Set(), 1)).toBe(1);
  });

  it('misses away from every difference, and ignores ones already found', () => {
    expect(hitSpot({ x: 0.5, y: 0.5 }, all, new Set(), 1)).toBe(-1);
    expect(hitSpot({ x: 0.2, y: 0.2 }, all, new Set([0]), 1)).toBe(-1);
  });

  it('measures across the picture in its own proportions', () => {
    // 0.06 across on a picture twice as wide as tall is 0.12 heights: outside a 0.1 radius.
    expect(hitSpot({ x: 0.26, y: 0.2 }, all, new Set(), 2)).toBe(-1);
  });
});
