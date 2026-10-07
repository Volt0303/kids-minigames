/**
 * Jigsaw piece shapes for ④ おさかなパズル: every inner edge between two pieces gets a round
 * knob that sticks out of one piece and into its neighbour, so the pieces lock together.
 * Shared by the build tool (cuts the pieces) and the game (draws the slot outlines).
 * Pure and import-free, so tools/build-puzzles.mjs can load it directly.
 */

export interface Pt {
  x: number;
  y: number;
}

/** Knob height relative to the piece's shorter side. */
export const TAB_SHARE = 0.22;
const ARC_STEPS = 14;

/** Knob height in pixels for pieces of this size. */
export function tabSize(width: number, height: number): number {
  return Math.round(Math.min(width, height) * TAB_SHARE);
}

/** Which way the knob of an inner edge points: +1 towards +x / +y, −1 the other way. */
function horizontalSign(row: number, col: number): number {
  return (row + col) % 2 === 0 ? 1 : -1;
}

function verticalSign(row: number, col: number): number {
  return (row + col) % 2 === 0 ? -1 : 1;
}

/**
 * Points along one edge from `a` to `b`. `normal` is a unit vector across the edge; `sign`
 * (+1 / −1 / 0) says which way the knob points along it (0: straight border edge).
 */
function edge(a: Pt, b: Pt, knob: { normal: Pt; sign: number; tab: number }): Pt[] {
  const { normal, sign, tab } = knob;
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const dir = { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
  const at = (u: number, v: number): Pt => ({
    x: a.x + dir.x * u + normal.x * v * sign,
    y: a.y + dir.y * u + normal.y * v * sign,
  });
  if (sign === 0) return [a, b];
  const mid = length / 2;
  const radius = tab * 0.5;
  const centre = tab - radius;
  const neck = tab * 0.28;
  const points: Pt[] = [a, at(mid - neck, 0)];
  // Round knob: from its lower-left (200°) over the top to its lower-right (−20°).
  for (let i = 0; i <= ARC_STEPS; i++) {
    const angle = ((200 - (220 * i) / ARC_STEPS) * Math.PI) / 180;
    points.push(at(mid + radius * Math.cos(angle), centre + radius * Math.sin(angle)));
  }
  points.push(at(mid + neck, 0), b);
  return points;
}

/**
 * Outline of piece `index` (left to right, top to bottom) of a `cols` × `rows` puzzle whose
 * pieces are `width` × `height`, in the piece picture's own pixels: the picture is padded by
 * the knob height on every side, so the piece's cell starts at (tab, tab).
 */
export function pieceOutline(index: number, grid: { cols: number; rows: number; width: number; height: number }): Pt[] {
  const { cols, rows, width, height } = grid;
  const tab = tabSize(width, height);
  const col = index % cols;
  const row = Math.floor(index / cols);
  const tl = { x: tab, y: tab };
  const tr = { x: tab + width, y: tab };
  const br = { x: tab + width, y: tab + height };
  const bl = { x: tab, y: tab + height };
  const down = { x: 0, y: 1 };
  const right = { x: 1, y: 0 };
  const top = row > 0 ? horizontalSign(row - 1, col) : 0;
  const bottom = row < rows - 1 ? horizontalSign(row, col) : 0;
  const left = col > 0 ? verticalSign(row, col - 1) : 0;
  const rightSide = col < cols - 1 ? verticalSign(row, col) : 0;
  return [
    ...edge(tl, tr, { normal: down, sign: top, tab }),
    ...edge(tr, br, { normal: right, sign: rightSide, tab }).slice(1),
    ...edge(bl, br, { normal: down, sign: bottom, tab }).reverse().slice(1),
    ...edge(tl, bl, { normal: right, sign: left, tab }).reverse().slice(1),
  ];
}
