import { describe, expect, it } from 'vitest';
import { fishScale, RELATIVE_SIZE, ROW_FILL } from './fishSize';

const ROW = 230;
const SLOT = 420;

describe('fishScale', () => {
  it('draws each fish exactly at its relative size, so changing a value always changes the fish', () => {
    const picture = { width: 300, height: 160 };
    // The turtle is the current largest (relative size 1), so it reaches the row's full height.
    const turtle = fishScale('turtle', picture, ROW, SLOT) * picture.height;
    const tropical = fishScale('blue-tropical', picture, ROW, SLOT) * picture.height;
    expect(turtle).toBeCloseTo(ROW * ROW_FILL);
    expect(tropical / turtle).toBeCloseTo(RELATIVE_SIZE['blue-tropical'] / RELATIVE_SIZE.turtle);
  });

  it('keeps tall pictures (squid, octopus) at their own size instead of the row maximum', () => {
    const squid = fishScale('squid', { width: 200, height: 252 }, ROW, SLOT) * 252;
    expect(squid).toBeCloseTo(RELATIVE_SIZE.squid * ROW * ROW_FILL);
  });

  it('never makes a fish taller than its row allows or wider than its slot', () => {
    for (const fish of Object.keys(RELATIVE_SIZE) as (keyof typeof RELATIVE_SIZE)[]) {
      for (const picture of [
        { width: 360, height: 170 },
        { width: 200, height: 300 },
        { width: 240, height: 220 },
      ]) {
        const scale = fishScale(fish, picture, ROW, SLOT);
        expect(picture.height * scale).toBeLessThanOrEqual(ROW * ROW_FILL + 0.001);
        expect(picture.width * scale).toBeLessThanOrEqual(SLOT + 0.001);
      }
    }
  });

  it('keeps every size between 0.42 and 1', () => {
    const sizes = Object.values(RELATIVE_SIZE);
    expect(Math.max(...sizes)).toBeLessThanOrEqual(1);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(0.42);
  });

  it('keeps tuna and the turtle as the largest, and the reef fish as the smallest', () => {
    const large = Math.max(RELATIVE_SIZE.tuna, RELATIVE_SIZE.turtle);
    const small = Math.max(
      RELATIVE_SIZE['blue-tropical'],
      RELATIVE_SIZE['yellow-tropical'],
      RELATIVE_SIZE['striped-orange'],
    );
    for (const [fish, size] of Object.entries(RELATIVE_SIZE)) {
      if (fish === 'tuna' || fish === 'turtle') continue;
      expect(size).toBeLessThanOrEqual(large);
    }
    expect(small).toBeLessThan(RELATIVE_SIZE.bonito);
  });

  it('rejects an empty picture', () => {
    expect(() => fishScale('tuna', { width: 0, height: 10 }, ROW, SLOT)).toThrow(RangeError);
  });
});
