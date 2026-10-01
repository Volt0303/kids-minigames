/**
 * Fish sizes for おさかな探し. Each kind has its own size, so the sea looks like the
 * client's mockup — big tuna, small tropical fish — instead of every fish filling its row.
 *
 * The size is the fish's height as a share of the largest height a row allows, so every
 * value always takes effect: 1 = as tall as the row allows, 0.5 = half that height.
 */
import type { Fish } from '../stages';

/** Height relative to the tallest allowed (tuna = 1). Kept ≥ 0.55 so small fish stay easy to see. */
export const RELATIVE_SIZE: Record<Fish, number> = {
  tuna: 1,
  yellowtail: 0.95,
  salmon: 0.9,
  turtle: 0.9,
  bonito: 0.85,
  squid: 0.85,
  'sea-bream': 0.85,
  flatfish: 0.8,
  octopus: 0.8,
  pufferfish: 0.65,
  'yellow-tropical': 0.62,
  crab: 0.6,
  'striped-orange': 0.6,
  'blue-tropical': 0.55,
};

/** The tallest a fish may be, as a share of its row's height (room is left between rows). */
export const ROW_FILL = 0.78;

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
