/**
 * The serving platter of stages 1–2 of 注文のお手伝いゲーム (sushi atlas `platter-fish`, a
 * fish-shaped dish): it lies on the counter in the background picture, and the sushi to choose from stand
 * inside the dish's inner rim in one or two rows.
 */
import { rect, type Rect } from '../../../core/logic/rect';
import { PIECE, PIECE_FOOT, PIECE_GAP, type Grid } from './placement';

/** Where the front edge of the counter is in the background picture, as a share of the field's height. */
export const LEDGE = 0.9;
const MARGIN = 24;
/** The platter's bottom stays this far (share of the field's height) behind the counter's front edge. */
const SET_BACK = 0.02;
/** The platter's height as a share of the field's height, and its widest share of the field. */
const PLATTER_SHARE = 0.56;
const MAX_WIDTH_SHARE = 0.72;
/**
 * The inner rim of the dish in the platter picture, as an ellipse in shares of the picture
 * (centre and radii). Every plate stays inside it; the sushi on the back plates may rise above it.
 */
const RIM = { cx: 0.5, cy: 0.5, rx: 0.35, ry: 0.32 } as const;
/** Share of the rim used, so plates keep clear of the rim line. */
const RIM_USE = 0.94;
/** A plate's height, from its bottom to the top of its rim, at the sushi's scale 1 (see SushiPiece). */
const PLATE_HEIGHT = 132;
/** Space between the two rows of plates (negative overlap), so the back plates stay visible. */
const ROW_OVERLAP = -0.3;

export interface TablePlan {
  /** The platter picture, at its own proportions. */
  table: Rect;
  /** Where the sushi stand, and their scale. */
  sushi: Grid;
}

export function planTable(field: Rect, count: number, platterAspect: number): TablePlan {
  let height = field.height * PLATTER_SHARE;
  let width = height * platterAspect;
  if (width > field.width * MAX_WIDTH_SHARE) {
    width = field.width * MAX_WIDTH_SHARE;
    height = width / platterAspect;
  }
  const bottom = field.y + field.height * (LEDGE - SET_BACK);
  const table = rect(field.x + (field.width - width) / 2, bottom - height, width, height);
  const centre = { x: table.x + width * RIM.cx, y: table.y + height * RIM.cy };
  const radius = { x: width * RIM.rx * RIM_USE, y: height * RIM.ry * RIM_USE };
  /** Half the rim's width at height `y`. */
  const halfWidthAt = (y: number): number => radius.x * Math.sqrt(Math.max(0, 1 - ((y - centre.y) / radius.y) ** 2));

  // Rows of plates fill the rim's height, centred in it; each row is as wide as the rim there.
  const layout = (rows: number): { scale: number; feet: number[]; columns: number } => {
    const columns = Math.ceil(count / rows);
    const stacked = rows - ROW_OVERLAP * (rows - 1);
    let scale = Math.min((2 * radius.y) / (PLATE_HEIGHT * stacked), 1);
    const feet = (s: number): number[] => {
      const front = centre.y + (PLATE_HEIGHT * s * stacked) / 2;
      const step = PLATE_HEIGHT * s * (1 - ROW_OVERLAP);
      return Array.from({ length: rows }, (_, r) => front - step * (rows - 1 - r));
    };
    for (const foot of feet(scale)) {
      // The plates' widest line is their middle; it must fit inside the rim there.
      const middle = foot - (PLATE_HEIGHT * scale) / 2;
      scale = Math.min(scale, (2 * halfWidthAt(middle)) / columns / (PIECE.width + PIECE_GAP));
    }
    return { scale, feet: feet(scale), columns };
  };
  const one = layout(1);
  const two = layout(2);
  const { scale, feet, columns } = count > 1 && two.scale > one.scale ? two : one;
  const cell = (PIECE.width + PIECE_GAP) * scale;

  const positions = Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / columns);
    const inRow = Math.min(columns, count - row * columns);
    const foot = feet[row] ?? centre.y;
    const left = centre.x - (inRow * cell) / 2;
    return { x: left + ((i % columns) + 0.5) * cell, y: foot - PIECE_FOOT * scale };
  });
  return { table, sushi: { positions, scale } };
}

/** The sushi of stage 3 stand this far (share of the field's height) behind the shelf's front edge: along its middle. */
const SHELF_SET_BACK = 0.1;

/** Where the plates of stage 3 stand: on the counter's shelf, just behind its front edge. */
export function shelfY(field: Rect): number {
  return field.y + field.height * (LEDGE - SHELF_SET_BACK);
}

/** Height of the lane the stage-3 sushi slide in (sushi included), as a share of the field's height. */
const LANE_SHARE = 0.4;

/** The lane of stage 3 runs along the counter's shelf, just above its front edge. */
export function counterArea(field: Rect): Rect {
  const height = field.height * LANE_SHARE;
  return rect(field.x + MARGIN, field.y + field.height * LEDGE - height, field.width - MARGIN * 2, height);
}
