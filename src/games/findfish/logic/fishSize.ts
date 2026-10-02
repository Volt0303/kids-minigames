/**
 * Fish sizes for おさかな探し. Each kind has its own size, so the sea looks like the
 * client's mockup — big tuna, small tropical fish — instead of every fish filling its row.
 *
 * The size is the fish's height as a share of the largest height a row allows, so every
 * value always takes effect: 1 = as tall as the row allows, 0.5 = half that height.
 */
import type { Fish } from '../stages';

/**
 * Height relative to the tallest allowed (1 = the sea turtle, the largest here), ordered
 * to match real adult sizes: the reef fish (striped-orange, yellow-tropical, blue-tropical)
 * are the smallest, as they are in life. Kept ≥ 0.42 so even the smallest fish stay easy
 * to see (their tap area is always full-size regardless).
 */
export const RELATIVE_SIZE: Record<Fish, number> = {
  turtle: 1, // sea turtle: one of the largest animals here
  tuna: 0.94, // bluefin tuna: up to ~2-3 m, but drawn a touch smaller than the turtle
  yellowtail: 0.88, // ~80-100 cm
  salmon: 0.82, // ~70-90 cm
  'sea-bream': 0.74, // ~50-70 cm
  octopus: 0.78, // body plus spread arms look large, ~70-100 cm reach
  flatfish: 0.7, // ~50-80 cm, but low and flat
  squid: 0.72, // ~20-40 cm, drawn a bit larger so it reads clearly among the fish
  bonito: 0.66, // skipjack tuna: notably smaller than true tuna, ~40-50 cm
  pufferfish: 0.68, // ~30-40 cm, round and plump so it needs height to read well
  crab: 0.5, // ~10-20 cm
  'yellow-tropical': 0.46, // small reef fish, ~10-15 cm
  'striped-orange': 0.46,
  'blue-tropical': 0.44,
};

/**
 * The tallest a fish may be, as a share of its row's height. Fish never move vertically
 * (only side to side), so this only has to clear the picture itself — a small margin is
 * enough to keep rows looking separated.
 */
export const ROW_FILL = 0.88;

export interface FishBox {
  /** Picture size (unscaled). */
  width: number;
  height: number;
}

/**
 * Display scale of a fish picture: its height is its relative size times the tallest a row
 * allows. Only a very long picture can be held back further, by the width of its slot.
 */
export function fishScale(fish: Fish, picture: FishBox, rowHeight: number, maxWidth: number): number {
  if (!(picture.width > 0 && picture.height > 0)) throw new RangeError('fishScale: picture size must be positive');
  const height = RELATIVE_SIZE[fish] * rowHeight * ROW_FILL;
  return Math.min(height / picture.height, maxWidth / picture.width);
}
