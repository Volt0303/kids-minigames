/**
 * The circle drawn on a found difference, as one smooth pen stroke: it starts at the upper
 * left, goes once round and runs a little past its start, slightly inside it (as a hand-drawn
 * circle does). Points are for radius 1 around (0, 0), as a flat list x0, y0, x1, y1… —
 * computed once and scaled when drawn.
 */

const POINTS = 120;
const START_ANGLE = (-125 * Math.PI) / 180;
/** How far past one full turn the stroke runs. */
const OVERRUN = 0.1;
/** The end of the stroke is this much smaller than the start, so the overlap sits inside. */
const SHRINK = 0.07;
/** Slightly wider than tall, like a quick pen circle. */
const STRETCH_X = 1.04;

function buildPenCircle(): readonly number[] {
  const points: number[] = [];
  for (let i = 0; i <= POINTS; i++) {
    const share = i / POINTS;
    const angle = START_ANGLE + share * Math.PI * 2 * (1 + OVERRUN);
    const r = 1 - SHRINK * share;
    points.push(r * STRETCH_X * Math.cos(angle), r * Math.sin(angle));
  }
  return points;
}

export const PEN_CIRCLE: readonly number[] = buildPenCircle();

/** Number of points in PEN_CIRCLE. */
export const PEN_CIRCLE_LENGTH = PEN_CIRCLE.length / 2;

/**
 * Points of a star / sparkle of radius 1 with `tips` points (inner radius `inner`), first tip
 * up, as a flat list x0, y0, x1, y1…
 */
export function starPoints(tips: number, inner: number): number[] {
  const points: number[] = [];
  for (let i = 0; i < tips * 2; i++) {
    const r = i % 2 === 0 ? 1 : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / tips;
    points.push(r * Math.cos(angle), r * Math.sin(angle));
  }
  return points;
}
