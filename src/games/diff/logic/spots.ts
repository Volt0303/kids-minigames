/**
 * The difference spots of 間違い探し: where each difference is, and which one a tap found.
 * Positions are shares of a picture; distances are measured in the picture's own pixels so a
 * tap circle is round on any picture shape.
 */
import type { Item, Round } from './scene';

export interface Spot {
  x: number;
  y: number;
  /** Radius as a share of the picture's height. */
  radius: number;
}

/** A spot is a little larger than its item, and never too small for a finger. */
const SPOT_SCALE = 0.65;
const MIN_RADIUS = 0.09;

export function spotOf(item: Item): Spot {
  return { x: item.x, y: item.y, radius: Math.max(MIN_RADIUS, item.size * SPOT_SCALE) };
}

/** The spots of every difference, in the round's order. */
export function spots(round: Round): Spot[] {
  return round.differences.map((difference) => {
    const item = round.items[difference.item];
    if (!item) throw new RangeError(`diff: difference points at missing item ${difference.item}`);
    return spotOf(item);
  });
}

/**
 * The difference a tap at (x, y) — shares of a picture `aspect` wide per unit of height —
 * found, or -1. Already found ones and misses return -1; the nearest wins if spots overlap.
 */
export function hitSpot(
  tap: { x: number; y: number },
  all: readonly Spot[],
  found: ReadonlySet<number>,
  aspect: number,
): number {
  let best = -1;
  let bestDistance = Infinity;
  all.forEach((spot, i) => {
    if (found.has(i)) return;
    const distance = Math.hypot((tap.x - spot.x) * aspect, tap.y - spot.y);
    if (distance <= spot.radius && distance < bestDistance) {
      best = i;
      bestDistance = distance;
    }
  });
  return best;
}
