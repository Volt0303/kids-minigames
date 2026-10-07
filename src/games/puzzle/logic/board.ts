/**
 * Where things go in the おさかなパズル field (open layout, as in the game's design):
 *
 *   ┌───────── yellow panel ─────────┐ ┌──── pink panel ────┐
 *   │ [パズルを うごかそう!]          │ │ [えを かんせい…]   │
 *   │            board               │ │   finished picture │
 *   ├──────── tray (pieces) ─────────┤ │    [かんせいず]    │
 *   └────────────────────────────────┘ └────────────────────┘
 *   [guide] (speech bubble)              [hint panel  (👁)]
 *
 * On the wide screen the guide and its bubble stand left of the panels and the hint panel
 * right of them. Also decides when a dropped piece snaps.
 */
import { fitContain, rect, type Rect } from '../../../core/logic/rect';

export interface Point {
  x: number;
  y: number;
}

export interface PuzzleLayout {
  /** Yellow panel (board and tray) and its label pill area. */
  puzzlePanel: Rect;
  /** The whole picture's place on the board. */
  board: Rect;
  /** Scale of the picture (and its pieces) on the board. */
  scale: number;
  /** The tray strip the pieces start in. */
  tray: Rect;
  /** Pink panel with the finished picture. */
  previewPanel: Rect;
  /** The finished picture inside the pink panel. */
  preview: Rect;
  guide: Rect;
  bubble: Rect;
  hintPanel: Rect;
}

const GAP = 24;
/** Room inside a panel for its label pill (top) and padding. */
export const LABEL_SPACE = 70;
const PAD = 22;
/** Room under the finished picture for the 「かんせいず」 ribbon. */
export const RIBBON_SPACE = 90;
/** Fields wider than this (width / height) use the wide arrangement. */
const WIDE = 3;
/** The standard arrangement is at most this wide relative to its height (centred). */
const MAX_ASPECT = 2.15;

function fitPicture(area: Rect, picture: { width: number; height: number }): { box: Rect; scale: number } {
  const fit = fitContain(picture.width, picture.height, area);
  const width = picture.width * fit.scale;
  const height = picture.height * fit.scale;
  return { box: rect(fit.x - width / 2, fit.y - height / 2, width, height), scale: fit.scale };
}

/** The yellow panel's top row, holding its label. */
export const TOP_ROW = LABEL_SPACE + 22;
/** Space between the board and the tray strip below it. */
const TRAY_GAP = 50;

/** Label row, board, then the tray strip, inside the yellow panel. */
function puzzleParts(
  panel: Rect,
  picture: { width: number; height: number },
): Pick<PuzzleLayout, 'board' | 'scale' | 'tray'> {
  const inner = rect(panel.x + PAD, panel.y + TOP_ROW, panel.width - PAD * 2, panel.height - TOP_ROW - PAD);
  const trayHeight = inner.height * 0.27;
  const { box, scale } = fitPicture(rect(inner.x, inner.y, inner.width, inner.height - trayHeight - TRAY_GAP), picture);
  const tray = rect(inner.x, inner.y + inner.height - trayHeight, inner.width, trayHeight);
  return { board: box, scale, tray };
}

/** The finished picture is shown a little smaller than the board, so the board stands out. */
const PREVIEW_SHARE = 0.85;

function previewPart(panel: Rect, picture: { width: number; height: number }, board: Rect): Rect {
  const full = rect(
    panel.x + PAD,
    panel.y + LABEL_SPACE,
    panel.width - PAD * 2,
    panel.height - LABEL_SPACE - RIBBON_SPACE - PAD,
  );
  const width = Math.min(full.width, board.width * PREVIEW_SHARE);
  const height = Math.min(full.height, board.height * PREVIEW_SHARE);
  const area = rect(full.x + (full.width - width) / 2, full.y + (full.height - height) / 2, width, height);
  return fitPicture(area, picture).box;
}

function standard(field: Rect, picture: { width: number; height: number }): PuzzleLayout {
  const width = Math.min(field.width, field.height * MAX_ASPECT);
  const content = rect(field.x + (field.width - width) / 2, field.y, width, field.height);
  const bottomHeight = content.height * 0.19;
  const topHeight = content.height - bottomHeight - GAP;
  const puzzlePanel = rect(content.x, content.y, content.width * 0.62, topHeight);
  const previewPanel = rect(
    puzzlePanel.x + puzzlePanel.width + GAP,
    content.y,
    content.width - puzzlePanel.width - GAP,
    topHeight,
  );
  const bottomY = content.y + topHeight + GAP;
  const guideHeight = bottomHeight * 1.12;
  const guide = rect(content.x, content.y + content.height - guideHeight, guideHeight * 0.72, guideHeight);
  const bubble = rect(
    guide.x + guide.width + 10,
    bottomY,
    puzzlePanel.x + puzzlePanel.width - guide.x - guide.width - 10,
    bottomHeight,
  );
  const hintPanel = rect(previewPanel.x, bottomY, previewPanel.width, bottomHeight);
  const parts = puzzleParts(puzzlePanel, picture);
  return {
    puzzlePanel,
    ...parts,
    previewPanel,
    preview: previewPart(previewPanel, picture, parts.board),
    guide,
    bubble,
    hintPanel,
  };
}

function wide(field: Rect, picture: { width: number; height: number }): PuzzleLayout {
  const sideWidth = field.height * 0.56;
  const left = rect(field.x, field.y, sideWidth, field.height);
  const right = rect(field.x + field.width - sideWidth, field.y, sideWidth, field.height);
  const middle = rect(left.x + left.width + GAP, field.y, right.x - left.x - left.width - GAP * 2, field.height);
  const puzzlePanel = rect(middle.x, middle.y, middle.width * 0.62, middle.height);
  const previewPanel = rect(
    puzzlePanel.x + puzzlePanel.width + GAP,
    middle.y,
    middle.width - puzzlePanel.width - GAP,
    middle.height,
  );
  const guide = rect(left.x + left.width * 0.12, left.y + left.height * 0.42, left.width * 0.76, left.height * 0.58);
  const bubble = rect(left.x, left.y, left.width, left.height * 0.38);
  const hintPanel = rect(right.x, right.y + right.height * 0.08, right.width, right.height * 0.84);
  const parts = puzzleParts(puzzlePanel, picture);
  return {
    puzzlePanel,
    ...parts,
    previewPanel,
    preview: previewPart(previewPanel, picture, parts.board),
    guide,
    bubble,
    hintPanel,
  };
}

export function planPuzzle(field: Rect, picture: { width: number; height: number }): PuzzleLayout {
  return field.width / field.height > WIDE ? wide(field, picture) : standard(field, picture);
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
      ((tray.width / cols) * 0.98) / piece.width,
      ((tray.height / rows) * 0.98) / piece.height,
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
