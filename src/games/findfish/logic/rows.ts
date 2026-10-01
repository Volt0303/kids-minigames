/**
 * Swimming rows for おさかな探し. Fish in a row share one speed and direction and
 * keep a fixed spacing, wrapping around at the edges — so fish never overlap and
 * a tap always reaches the fish the child sees.
 */
import type { Rect } from '../../../core/logic/rect';

export interface RowPlan {
  /** Vertical centre of the row (design units). */
  y: number;
  height: number;
  /** +1 swims right, -1 swims left. Rows alternate. */
  direction: 1 | -1;
  /** Fish in this row. */
  count: number;
}

export interface SwimPlan {
  rows: RowPlan[];
  /** Horizontal distance a fish travels before it wraps around (field width + one fish). */
  loopLength: number;
  /** Left end of the loop; fish wrap from `loopStart + loopLength` back to here. */
  loopStart: number;
  /** Fish that fit; may be below the requested count on a narrow screen. */
  placed: number;
}

/** Minimum empty space between two fish in the same row. */
export const FISH_GAP = 60;

/** How many fish fit in one row without overlapping. */
export function rowCapacity(fieldWidth: number, fishWidth: number, gap = FISH_GAP): number {
  if (!(fishWidth > 0)) throw new RangeError('rowCapacity: fish width must be positive');
  return Math.max(1, Math.floor((fieldWidth + fishWidth) / (fishWidth + gap)));
}

/** Spreads `fishCount` fish over `rowCount` rows, never exceeding a row's capacity. */
export function planRows(field: Rect, fishCount: number, rowCount: number, fishWidth: number): SwimPlan {
  if (rowCount < 1) throw new RangeError('planRows: at least one row is required');
  const capacity = rowCapacity(field.width, fishWidth);
  const placed = Math.min(fishCount, capacity * rowCount);
  const height = field.height / rowCount;

  const rows: RowPlan[] = [];
  for (let i = 0; i < rowCount; i++) {
    const base = Math.floor(placed / rowCount);
    const count = base + (i < placed % rowCount ? 1 : 0);
    rows.push({ y: field.y + height * (i + 0.5), height, direction: i % 2 === 0 ? 1 : -1, count });
  }
  return { rows, loopLength: field.width + fishWidth, loopStart: field.x - fishWidth / 2, placed };
}

/** Evenly spaced starting positions along the loop; rows are offset so columns do not line up. */
export function slotPositions(plan: SwimPlan, rowIndex: number): number[] {
  const row = plan.rows[rowIndex];
  if (!row || row.count === 0) return [];
  const spacing = plan.loopLength / row.count;
  const offset = (rowIndex % 2) * (spacing / 2);
  return Array.from({ length: row.count }, (_, i) => plan.loopStart + offset + spacing * i);
}

/** Wraps a position back into the loop [start, start + length). */
export function wrap(x: number, start: number, length: number): number {
  const offset = (((x - start) % length) + length) % length;
  return start + offset;
}

/** Distance over which a fish fades out as it nears the field's left or right border. */
export const EDGE_FADE = 60;

/**
 * Opacity of a fish centred at `x` with half-width `halfWidth`: fully visible inside the
 * field, fading to 0 by the time its edge touches the border, so no part of a fish is
 * ever drawn outside the field's frame while it wraps around.
 */
export function edgeAlpha(x: number, halfWidth: number, left: number, right: number): number {
  const room = Math.min(x - left, right - x) - halfWidth;
  return Math.min(1, Math.max(0, room / EDGE_FADE));
}
