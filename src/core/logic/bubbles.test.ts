import { describe, expect, it } from 'vitest';
import {
  bubbleAlpha,
  bubbleCount,
  bubbleX,
  createBubble,
  MAX_BUBBLES,
  MAX_RADIUS,
  MIN_RADIUS,
  stepBubble,
  ventPositions,
  type BubbleArea,
} from './bubbles';

/** Small deterministic generator so the tests do not depend on Math.random. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2 ** 31;
    return state / 2 ** 31;
  };
}

const area: BubbleArea = { width: 1920, top: -40, bottom: 1120, vents: [400, 1500] };

describe('bubbles', () => {
  it('scales the count with screen width, within limits', () => {
    expect(bubbleCount(1728)).toBeLessThan(bubbleCount(3840));
    expect(bubbleCount(100)).toBe(8);
    expect(bubbleCount(100_000)).toBe(MAX_BUBBLES);
  });

  it('places at least two vents inside the screen', () => {
    const vents = ventPositions(1728, seeded(1));
    expect(vents.length).toBeGreaterThanOrEqual(2);
    for (const x of vents) expect(x).toBeGreaterThan(0);
    for (const x of vents) expect(x).toBeLessThan(1728);
  });

  it('makes mostly small bubbles, all within the size range', () => {
    const random = seeded(7);
    const radii = Array.from({ length: 500 }, () => createBubble(area, random).radius);
    for (const r of radii) expect(r).toBeGreaterThanOrEqual(MIN_RADIUS);
    for (const r of radii) expect(r).toBeLessThanOrEqual(MAX_RADIUS);
    const small = radii.filter((r) => r < (MIN_RADIUS + MAX_RADIUS) / 2).length;
    expect(small / radii.length).toBeGreaterThan(0.7);
  });

  it('lets larger bubbles rise faster', () => {
    const random = seeded(3);
    const bubbles = Array.from({ length: 300 }, () => createBubble(area, random));
    const big = bubbles.filter((b) => b.radius > 20);
    const small = bubbles.filter((b) => b.radius < 8);
    const mean = (list: typeof bubbles): number => list.reduce((sum, b) => sum + b.speed, 0) / list.length;
    expect(mean(big)).toBeGreaterThan(mean(small));
  });

  it('rises and re-spawns at the bottom after leaving the top', () => {
    const random = seeded(11);
    const bubble = createBubble(area, random);
    bubble.y = 500;
    stepBubble(bubble, area, 0.5, random);
    expect(bubble.y).toBeLessThan(500);
    bubble.y = area.top - 100;
    stepBubble(bubble, area, 0.016, random);
    expect(bubble.y).toBeGreaterThanOrEqual(area.bottom);
  });

  it('sways around its centre line', () => {
    const bubble = createBubble(area, seeded(5));
    for (let t = 0; t < 5; t += 0.1)
      expect(Math.abs(bubbleX(bubble, t) - bubble.baseX)).toBeLessThanOrEqual(bubble.sway);
  });

  it('is invisible at the edges and fully visible in the middle', () => {
    const bubble = createBubble(area, seeded(9));
    bubble.y = area.bottom;
    expect(bubbleAlpha(bubble, area)).toBe(0);
    bubble.y = area.top;
    expect(bubbleAlpha(bubble, area)).toBe(0);
    bubble.y = (area.top + area.bottom) / 2;
    expect(bubbleAlpha(bubble, area)).toBeCloseTo(bubble.opacity);
  });
});
