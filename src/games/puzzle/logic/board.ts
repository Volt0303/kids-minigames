/**
 * Where things go in the おさかなパズル field: the board (the picture's place, with one slot per
 * piece) and the tray the pieces start in — board left and tray right on a landscape field,
 * board top and tray bottom on a tall one. Also decides when a dropped piece snaps.
 */
import { fitContain, rect, type Rect } from '../../../core/logic/rect';

export interface Point {
  x: number;
  y: number;
}

export interface PuzzleLayout {
  /** The whole picture's place on the board. */
  board: Rect;
  /** Scale of the picture (and its pieces) on the board. */
  scale: number;
  /** The tray the pieces start in. */
  tray: Rect;
  /** Where the hint button goes. */
  hintButton: Point;
}

const GAP = 30;
/** Fields wider than this (width / height) put the tray to the right of the board. */
const SIDE_BY_SIDE = 1.3;
/** Share of the field used by the board (the rest is the tray). */
const BOARD_SHARE = 0.6;

export function planPuzzle(field: Rect, picture: { width: number; height: number }): PuzzleLayout {
  const sideBySide = field.width / field.height > SIDE_BY_SIDE;
  const boardArea = sideBySide
    ? rect(field.x + GAP, field.y + GAP, field.width * BOARD_SHARE - GAP * 1.5, field.height - GAP * 2)
    : rect(field.x + GAP, field.y + GAP, field.width - GAP * 2, field.height * BOARD_SHARE - GAP * 1.5);
  const fit = fitContain(picture.width, picture.height, boardArea);
  const width = picture.width * fit.scale;
  const height = picture.height * fit.scale;
  const board = rect(fit.x - width / 2, fit.y - height / 2, width, height);
  const tray = sideBySide
    ? rect(
        boardArea.x + boardArea.width + GAP,
        field.y + GAP,
        field.x + field.width - boardArea.x - boardArea.width - GAP * 2,
        field.height - GAP * 2,
      )
    : rect(
        field.x + GAP,
        boardArea.y + boardArea.height + GAP,
        field.width - GAP * 2,
        field.y + field.height - boardArea.y - boardArea.height - GAP * 2,
      );
  return { board, scale: fit.scale, tray, hintButton: { x: board.x + board.width, y: board.y } };
}

/** Centre of each piece's slot on the board, left to right, top to bottom. */
export function slotCentres(board: Rect, cols: number, rows: number): Point[] {
  const width = board.width / cols;
  const height = board.height / rows;
  return Array.from({ length: cols * rows }, (_, i) => ({
    x: board.x + ((i % cols) + 0.5) * width,
    y: board.y + (Math.floor(i / cols) + 0.5) * height,
  }));
}

/**
 * Places for `count` pieces in the tray (in a grid that suits the tray's shape) and the scale
 * that fits them there — never larger than on the board.
 */
export function trayPlaces(
  tray: Rect,
  count: number,
  piece: { width: number; height: number },
  maxScale: number,
): { places: Point[]; scale: number } {
  let best = { cols: count, rows: 1, scale: 0 };
  for (let rows = 1; rows <= count; rows++) {
    const cols = Math.ceil(count / rows);
    const scale = Math.min(
      ((tray.width / cols) * 0.86) / piece.width,
      ((tray.height / rows) * 0.86) / piece.height,
      maxScale,
    );
    if (scale > best.scale) best = { cols, rows, scale };
  }
  const { cols, rows, scale } = best;
  const cellWidth = tray.width / cols;
  const cellHeight = tray.height / rows;
  const places = Array.from({ length: count }, (_, i) => ({
    x: tray.x + ((i % cols) + 0.5) * cellWidth,
    y: tray.y + (Math.floor(i / cols) + 0.5) * cellHeight,
  }));
  return { places, scale };
}

/** A piece snaps when dropped within this share of its own size from its slot (generous, for small hands). */
export const SNAP_SHARE = 0.4;

export function snaps(drop: Point, slot: Point, piece: { width: number; height: number }): boolean {
  return (
    Math.abs(drop.x - slot.x) <= piece.width * SNAP_SHARE && Math.abs(drop.y - slot.y) <= piece.height * SNAP_SHARE
  );
}
