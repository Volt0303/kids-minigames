import { describe, expect, it } from 'vitest';
import { STAGES } from '../stages';
import { nextTarget } from './rounds';

function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
}

describe('nextTarget', () => {
  it('always asks for a topping in the tray, never the same twice in a row', () => {
    for (const stage of STAGES) {
      const random = seeded(11);
      let previous = nextTarget(stage.choices, undefined, random);
      for (let i = 0; i < 200; i++) {
        const target = nextTarget(stage.choices, previous, random);
        expect(stage.choices).toContain(target);
        expect(target).not.toBe(previous);
        previous = target;
      }
    }
  });

  it('asks for look-alikes often in stage 3', () => {
    const choices = STAGES[2]?.choices ?? [];
    const random = seeded(4);
    let tricky = 0;
    let previous = nextTarget(choices, undefined, random);
    for (let i = 0; i < 400; i++) {
      previous = nextTarget(choices, previous, random);
      if (['tuna', 'fatty-tuna', 'squid', 'engawa'].includes(previous)) tricky += 1;
    }
    expect(tricky / 400).toBeGreaterThan(0.55);
  });

  it('every stage fills all six tray slots with distinct toppings', () => {
    expect(STAGES.map((stage) => stage.choices.length)).toEqual([6, 6, 6]);
    for (const stage of STAGES) expect(new Set(stage.choices).size).toBe(stage.choices.length);
  });
});
