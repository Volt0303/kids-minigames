import { describe, expect, it } from 'vitest';
import { spriteNames } from '../../../core/assets/catalog';
import { LOOK_ALIKES, STAGES, type FindFishStage } from '../stages';
import { buildRoster, type Random } from './roster';

const ALL = spriteNames('fish');

/** Deterministic pseudo-random numbers so tests are repeatable. */
function seeded(seed: number): Random {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

function stage(index: number): FindFishStage {
  const found = STAGES[index];
  if (!found) throw new Error(`no stage ${index}`);
  return found;
}

describe('buildRoster', () => {
  it.each([0, 1, 2])('stage %i contains exactly the goal number of targets', (index) => {
    for (let seed = 1; seed <= 20; seed++) {
      const roster = buildRoster(stage(index), 99, ALL, seeded(seed));
      expect(roster.fish.filter((f) => f === roster.target)).toHaveLength(stage(index).goal);
      expect(roster.fish).toHaveLength(stage(index).fishCount);
    }
  });

  it('stage 1 never shows fish that look like the target', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const roster = buildRoster(stage(0), 99, ALL, seeded(seed));
      const similar = LOOK_ALIKES[roster.target] ?? [];
      expect(roster.fish.some((f) => similar.includes(f))).toBe(false);
    }
  });

  it('stage 3 asks for tuna and includes look-alikes', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const roster = buildRoster(stage(2), 99, ALL, seeded(seed));
      expect(roster.target).toBe('tuna');
      expect(roster.fish.filter((f) => f === 'bonito' || f === 'yellowtail').length).toBeGreaterThanOrEqual(2);
    }
  });

  it('shrinks to what fits on a narrow screen but keeps every target', () => {
    const roster = buildRoster(stage(2), 12, ALL, seeded(3));
    expect(roster.fish).toHaveLength(12);
    expect(roster.fish.filter((f) => f === 'tuna')).toHaveLength(5);
  });

  it('only uses fish that exist in the art catalog', () => {
    const roster = buildRoster(stage(1), 99, ALL, seeded(7));
    for (const fish of roster.fish) expect(ALL).toContain(fish);
  });
});

describe('stage settings', () => {
  it('match the requirements document (3/8, 4/12, 5/12–15)', () => {
    expect(STAGES.map((s) => [s.goal, s.fishCount])).toEqual([
      [3, 8],
      [4, 12],
      [5, 15],
    ]);
  });

  it('get faster each stage', () => {
    expect(stage(0).speed).toBeLessThan(stage(1).speed);
    expect(stage(1).speed).toBeLessThan(stage(2).speed);
  });
});
