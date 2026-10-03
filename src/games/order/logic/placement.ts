/**
 * Where things go in the 注文のお手伝いゲーム field: the tray along the bottom, the sushi
 * on the counter above it (a grid), or on the conveyor (one moving lane).
 */
import { rect, type Rect } from '../../../core/logic/rect';

export interface Point {
  x: number;
  y: number;
}

/** A sushi on its plate, in design units at scale 1 (see SushiPiece). */
export const PIECE = { width: 280, height: 240 } as const;
/** A sushi without its plate (on the tray, in the order card), at scale 1 (see Nigiri). */
export const NIGIRI = { width: 230, height: 215 } as const;
/** Empty space kept around each sushi. */
export const PIECE_GAP = 40;
/** Share of the field's height used by the tray. */
const TRAY_SHARE = 0.32;
const MARGIN = 24;
/** Sushi are not drawn larger than their own picture size. */
const MAX_SCALE = 1;

export interface FieldPlan {
  /** Sushi are put out here. */
  counter: Rect;
  /** The tray the chosen sushi go to. */
  tray: Rect;
}

export function planField(field: Rect): FieldPlan {
  const trayHeight = field.height * TRAY_SHARE;
  const tray = rect(
    field.x + MARGIN,
    field.y + field.height - trayHeight,
    field.width - MARGIN * 2,
    trayHeight - MARGIN,
  );
  const counter = rect(field.x + MARGIN, field.y + MARGIN, field.width - MARGIN * 2, tray.y - field.y - MARGIN * 2);
  return { counter, tray };
}

export interface Grid {
  positions: Point[];
  /** Scale of each sushi. */
  scale: number;
}

/** Scale at which `columns × rows` sushi fit in `area`. */
function gridScale(area: Rect, columns: number, rows: number): number {
  const cellWidth = area.width / columns;
  const cellHeight = area.height / rows;
  return Math.min(cellWidth / (PIECE.width + PIECE_GAP), cellHeight / (PIECE.height + PIECE_GAP), MAX_SCALE);
}

/** `count` sushi in the rows-and-columns arrangement that lets them be largest. */
export function planGrid(area: Rect, count: number): Grid {
  let best = { columns: count, rows: 1, scale: gridScale(area, count, 1) };
  for (let rows = 2; rows <= Math.min(3, count); rows++) {
    const columns = Math.ceil(count / rows);
    const scale = gridScale(area, columns, rows);
    if (scale > best.scale) best = { columns, rows, scale };
  }
  const { columns, rows, scale } = best;
  const cellWidth = (PIECE.width + PIECE_GAP) * scale;
  const cellHeight = area.height / rows;
  const positions: Point[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / columns);
    // The last row may be shorter: centre it.
    const inRow = Math.min(columns, count - row * columns);
    const left = area.x + (area.width - inRow * cellWidth) / 2;
    positions.push({ x: left + ((i % columns) + 0.5) * cellWidth, y: area.y + (row + 0.5) * cellHeight });
  }
  return { positions, scale };
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

/** Sushi on the tray may overlap their neighbours a little, like on a real geta. */
const TRAY_OVERLAP = 0.85;

/**
 * `count` evenly spaced places on the tray board (`tray` is the board's picture) for the
 * chosen sushi, and their scale.
 */
export function traySlots(tray: Rect, count: number): Grid {
  const usable = tray.width * 0.82;
  const scale = Math.min(
    usable / count / (NIGIRI.width * TRAY_OVERLAP),
    (tray.height * 0.62) / NIGIRI.height,
    MAX_SCALE,
  );
  const step = Math.min(usable / count, NIGIRI.width * scale);
  const left = tray.x + tray.width / 2 - (step * count) / 2;
  const positions = Array.from({ length: count }, (_, i) => ({
    x: left + (i + 0.5) * step,
    y: tray.y + tray.height * 0.3,
  }));
  return { positions, scale };
}
