import { describe, expect, it } from 'vitest';
import { STAGES } from '../stages';
import { makeRound, mirrored } from './round';
import type { Scene } from './scene';

/** A repeatable random source. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;
    return state / 2_147_483_648;
  };
}

describe('makeRound', () => {
  it('picks goal differences on different items, each from its own list', () => {
    for (const stage of STAGES) {
      for (let seed = 1; seed <= 40; seed++) {
        const round = makeRound(stage.scenes, stage.goal, seeded(seed));
        const frames = (items: readonly { frame: string; y: number }[]): string =>
          JSON.stringify(items.map((i) => [i.frame, i.y]));
        const scene = stage.scenes.find((s) => frames(s.items) === frames(round.items));
        expect(scene).toBeDefined();
        expect(round.differences).toHaveLength(stage.goal);
        expect(new Set(round.differences.map((d) => d.item)).size).toBe(stage.goal);
        for (const d of round.differences) {
          const variation = scene?.variations.find((v) => v.item === d.item);
          expect(variation?.changes).toContainEqual(d.change);
        }
      }
    }
  });

  it('varies the scene, the differences and the mirroring from play to play', () => {
    const stage = STAGES[0];
    if (!stage) throw new Error('no stage');
    const rounds = Array.from({ length: 30 }, (_, seed) => makeRound(stage.scenes, stage.goal, seeded(seed + 1)));
    const looks = new Set(rounds.map((r) => JSON.stringify([r.items[0], r.differences])));
    expect(looks.size).toBeGreaterThan(10);
    expect(new Set(rounds.map((r) => r.items[0]?.x)).size).toBeGreaterThan(2);
  });

  it('refuses a scene that cannot give enough differences', () => {
    const scene: Scene = { setting: 'sea', items: [], variations: [] };
    expect(() => makeRound([scene], 3, () => 0)).toThrow(RangeError);
  });
});

describe('mirrored', () => {
  it('swaps left and right and turns every picture', () => {
    const [item] = mirrored([{ atlas: 'fish', frame: 'tuna', x: 0.3, y: 0.4, size: 0.2 }]);
    expect(item?.x).toBeCloseTo(0.7);
    expect(item?.y).toBe(0.4);
    expect(item?.flip).toBe(true);
  });
});
