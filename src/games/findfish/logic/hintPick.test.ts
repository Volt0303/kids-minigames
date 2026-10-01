import { describe, expect, it } from 'vitest';
import { pickEvenlyByRow } from './hintPick';

/** Small deterministic generator so the tests do not depend on Math.random. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2 ** 31;
    return state / 2 ** 31;
  };
}

describe('pickEvenlyByRow', () => {
  it('returns nothing when there is no candidate', () => {
    expect(pickEvenlyByRow([], Math.random)).toBeUndefined();
  });

  it('picks every row about equally often, even when one row has more fish', () => {
    // Row 0 has three candidates, rows 1 and 2 have one each.
    const candidates = [{ row: 0 }, { row: 0 }, { row: 0 }, { row: 1 }, { row: 2 }];
    const random = seeded(42);
    const counts = [0, 0, 0];
    for (let i = 0; i < 3000; i++) {
      const pick = pickEvenlyByRow(candidates, random);
      if (pick) counts[pick.row] = (counts[pick.row] ?? 0) + 1;
    }
    for (const count of counts) expect(count).toBeGreaterThan(850);
    for (const count of counts) expect(count).toBeLessThan(1150);
  });

  it('always returns one of the candidates', () => {
    const candidates = [
      { row: 2, id: 'a' },
      { row: 3, id: 'b' },
    ];
    for (const r of [0, 0.5, 0.9999]) expect(candidates).toContain(pickEvenlyByRow(candidates, () => r));
  });
});
