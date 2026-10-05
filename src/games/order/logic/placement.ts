/**
 * Sizes shared by the 注文のお手伝いゲーム field, and the conveyor lane of stage 3
 * (the table of stages 1–2 is planned in table.ts).
 */
import { NIGIRI_SIZE } from '../../../core/assets/sushi';
import type { Rect } from '../../../core/logic/rect';

export interface Point {
  x: number;
  y: number;
}

/** A sushi on its plate, in design units at scale 1 (see SushiPiece). */
export const PIECE = { width: 250, height: 235 } as const;
/** A sushi without its plate (in the order card), at scale 1. */
export const NIGIRI = NIGIRI_SIZE;
/** From a sushi's centre down to the bottom of its plate, at scale 1 (see SushiPiece). */
export const PIECE_FOOT = 136;
/** Empty space kept around each sushi. */
export const PIECE_GAP = 16;
/** Sushi are not drawn larger than their own picture size. */
const MAX_SCALE = 1;

export interface Grid {
  positions: Point[];
  /** Scale of each sushi. */
  scale: number;
}

export interface Belt {
  /** Vertical centre of the lane. */
  y: number;
  scale: number;
  /** Distance between two sushi on the belt. */
  spacing: number;
  /** Sushi wrap from `loopStart + loopLength` back to `loopStart`. */
  loopStart: number;
  loopLength: number;
  /** Starting x of each sushi. */
  positions: number[];
}

/** How many sushi fit side by side on the belt at `scale`. */
export function beltCapacity(area: Rect, scale: number): number {
  return Math.max(1, Math.floor(area.width / ((PIECE.width + PIECE_GAP) * scale)));
}

/** Scale of sushi on the belt: as large as the lane height allows. */
export function beltScale(area: Rect): number {
  return Math.min(area.height / (PIECE.height + PIECE_GAP), MAX_SCALE);
}

/**
 * One lane across the counter. The loop is a little longer than the field, so a sushi
 * leaving one side comes back on the other; all sushi keep the same spacing.
 */
export function planBelt(area: Rect, count: number): Belt {
  const scale = beltScale(area);
  const minSpacing = (PIECE.width + PIECE_GAP) * scale;
  const loopLength = Math.max(count * minSpacing, area.width + minSpacing);
  const spacing = loopLength / count;
  const loopStart = area.x - minSpacing / 2;
  const positions = Array.from({ length: count }, (_, i) => loopStart + (i + 0.5) * spacing);
  return { y: area.y + area.height / 2, scale, spacing, loopStart, loopLength, positions };
}
