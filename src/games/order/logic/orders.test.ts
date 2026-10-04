import { describe, expect, it } from 'vitest';
import { STAGES, type OrderStage } from '../stages';
import { shuffle } from '../../../core/logic/random';
import { dealPieces, nextOrder, orderSize, type Order } from './orders';

/** Deterministic pseudo-random sequence (LCG) for repeatable tests. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
}

function stage(index: number): OrderStage {
  const found = STAGES[index];
  if (!found) throw new Error(`no stage ${index}`);
  return found;
}

/** All orders of a stage, as the scene asks for them. */
function playStage(config: OrderStage, random: () => number): Order[] {
  const orders: Order[] = [];
  let remaining = config.goal;
  let previous: Order = [];
  while (remaining > 0) {
    const order = nextOrder(config, remaining, previous, random);
    orders.push(order);
    remaining -= orderSize(order);
    previous = order;
  }
  return orders;
}

describe('nextOrder', () => {
  it.each([0, 1, 2])('stage %i: orders add up exactly to the goal and follow the stage rules', (index) => {
    const config = stage(index);
    for (let seed = 1; seed <= 50; seed++) {
      const orders = playStage(config, seeded(seed));
      expect(orders.reduce((sum, order) => sum + orderSize(order), 0)).toBe(config.goal);
      for (const order of orders) {
        expect(order.length).toBeLessThanOrEqual(config.kindsPerOrder);
        expect(new Set(order.map((line) => line.kind)).size).toBe(order.length);
        for (const line of order) {
          expect(line.count).toBeGreaterThanOrEqual(1);
          expect(line.count).toBeLessThanOrEqual(config.maxPerKind);
          expect(config.menu).toContain(line.kind);
        }
      }
    }
  });

  it('uses the full number of kinds while enough sushi are still needed', () => {
    const order = nextOrder(stage(2), 10, [], seeded(7));
    expect(order).toHaveLength(3);
  });

  it('avoids the kinds of the previous order', () => {
    const config = stage(0);
    const random = seeded(3);
    let previous = nextOrder(config, 6, [], random);
    for (let i = 0; i < 20; i++) {
      const order = nextOrder(config, 6, previous, random);
      expect(order[0]?.kind).not.toBe(previous[0]?.kind);
      previous = order;
    }
  });

  it('rejects an order when nothing is left to serve', () => {
    expect(() => nextOrder(stage(0), 0, [], seeded(1))).toThrow(RangeError);
  });
});

describe('dealPieces', () => {
  const order: Order = [
    { kind: 'tuna', count: 2 },
    { kind: 'shrimp', count: 1 },
  ];

  it('puts out exactly the ordered pieces plus other kinds', () => {
    const pieces = dealPieces(order, stage(1), 99, seeded(5));
    expect(pieces).toHaveLength(stage(1).pieces);
    expect(pieces.filter((kind) => kind === 'tuna')).toHaveLength(2);
    expect(pieces.filter((kind) => kind === 'shrimp')).toHaveLength(1);
  });

  it('keeps at least two other sushi to choose against, even when space is short', () => {
    const pieces = dealPieces(order, stage(1), 3, seeded(5));
    expect(pieces).toHaveLength(5);
    expect(pieces.filter((kind) => kind !== 'tuna' && kind !== 'shrimp')).toHaveLength(2);
  });
});

describe('shuffle', () => {
  it('keeps every item', () => {
    expect(shuffle([1, 2, 3, 4, 5], seeded(9)).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});
