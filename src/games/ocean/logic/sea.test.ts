import { describe, expect, it } from 'vitest';
import { STAGES } from '../stages';
import { laneHeights, spawnTrash, trashPose } from './sea';

function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
}

describe('spawnTrash', () => {
  it('keeps new trash clear of the trash already there (a piece is about 0.11 of the field wide)', () => {
    const random = seeded(3);
    for (let round = 0; round < 50; round++) {
      const xs: number[] = [];
      for (let i = 0; i < 4; i++) xs.push(spawnTrash(xs, random).x);
      for (const [i, x] of xs.entries()) {
        for (const other of xs.slice(i + 1)) expect(Math.abs(x - other)).toBeGreaterThanOrEqual(0.12);
      }
    }
  });

  it('places trash inside the field, sinking all the way to the sand', () => {
    const random = seeded(8);
    for (let i = 0; i < 100; i++) {
      const trash = spawnTrash([], random);
      expect(trash.x).toBeGreaterThanOrEqual(0.1);
      expect(trash.x).toBeLessThanOrEqual(0.9);
      expect(trash.restY).toBeGreaterThan(trash.startY);
      expect(trash.restY).toBeGreaterThanOrEqual(0.8);
      expect(trash.restY).toBeLessThanOrEqual(0.86);
    }
  });
});

describe('trashPose', () => {
  const trash = { x: 0.5, startY: 0.12, restY: 0.6, phase: 0 };

  it('sinks, then stays near its resting height', () => {
    expect(trashPose(trash, 1, 0.1).y).toBeCloseTo(0.22);
    for (const t of [10, 20, 60]) expect(Math.abs(trashPose(trash, t, 0.1).y - 0.6)).toBeLessThanOrEqual(0.0081);
  });

  it('only sways a little', () => {
    for (let t = 0; t < 30; t += 0.7) expect(Math.abs(trashPose(trash, t, 0.1).x - 0.5)).toBeLessThanOrEqual(0.0121);
  });
});

describe('laneHeights', () => {
  it('spreads the lanes over the open water, top to bottom', () => {
    const lanes = laneHeights(4);
    expect(lanes).toHaveLength(4);
    expect(lanes[0]).toBeCloseTo(0.2);
    expect(lanes[3]).toBeCloseTo(0.78);
  });
});

describe('stages', () => {
  it('get harder: more trash to collect, more and faster fish', () => {
    for (let i = 1; i < STAGES.length; i++) {
      const [before, after] = [STAGES[i - 1], STAGES[i]];
      if (!before || !after) throw new Error('missing stage');
      expect(after.goal).toBeGreaterThan(before.goal);
      expect(after.fishCount).toBeGreaterThan(before.fishCount);
      expect(after.fishSpeed).toBeGreaterThan(before.fishSpeed);
    }
  });
});
