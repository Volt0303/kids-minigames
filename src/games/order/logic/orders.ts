/**
 * Orders for 注文のお手伝いゲーム: what the customer wants, and the sushi put out for it.
 * Randomness is injected so tests can fix it.
 */
import type { OrderStage, SushiKind } from '../stages';

export type Random = () => number;

export interface OrderLine {
  kind: SushiKind;
  count: number;
}

export type Order = readonly OrderLine[];

function pick<T>(items: readonly T[], random: Random): T {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) throw new RangeError('orders: cannot pick from an empty list');
  return item;
}

/** Fisher–Yates shuffle into a new array. */
export function shuffle<T>(items: readonly T[], random: Random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const a = result[i];
    const b = result[j];
    if (a === undefined || b === undefined) continue;
    result[i] = b;
    result[j] = a;
  }
  return result;
}

export function orderSize(order: Order): number {
  return order.reduce((sum, line) => sum + line.count, 0);
}

/**
 * The next order of the stage. It never asks for more sushi than are still needed
 * (`remaining`), so the orders of a stage add up exactly to its goal, and it avoids
 * the kinds of the previous order where the menu allows, so orders feel different.
 */
export function nextOrder(stage: OrderStage, remaining: number, previous: Order, random: Random): Order {
  if (remaining < 1) throw new RangeError('orders: nothing left to order');
  const kindCount = Math.min(stage.kindsPerOrder, remaining, stage.menu.length);
  const fresh = stage.menu.filter((kind) => !previous.some((line) => line.kind === kind));
  const pool = fresh.length >= kindCount ? fresh : stage.menu;
  const kinds = shuffle(pool, random).slice(0, kindCount);

  // One of each kind, then extra pieces at random while they fit.
  const counts = kinds.map(() => 1);
  let left = remaining - kindCount;
  for (let i = 0; i < kinds.length && left > 0; i++) {
    const room = Math.min(stage.maxPerKind - 1, left);
    const extra = Math.floor(random() * (room + 1));
    counts[i] = 1 + extra;
    left -= extra;
  }
  return kinds.map((kind, i) => ({ kind, count: counts[i] ?? 1 }));
}

/**
 * The sushi put out for an order: exactly the ordered pieces (so every sushi of an
 * ordered kind is a right answer) plus other kinds from the menu, shuffled. At least
 * two other sushi are always there to choose against.
 */
export function dealPieces(order: Order, stage: OrderStage, capacity: number, random: Random): SushiKind[] {
  const wanted = order.flatMap((line) => Array.from({ length: line.count }, () => line.kind));
  const others = stage.menu.filter((kind) => !order.some((line) => line.kind === kind));
  const total = Math.max(Math.min(stage.pieces, capacity), wanted.length + 2);
  const fillers = others.length === 0 ? [] : Array.from({ length: total - wanted.length }, () => pick(others, random));
  return shuffle([...wanted, ...fillers], random);
}
