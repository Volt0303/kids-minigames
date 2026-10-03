/**
 * Things that move in a loop across a field (swimming fish, a sushi conveyor): they wrap
 * around at the ends and fade out near the field's borders, so nothing is drawn outside it.
 */

/** Wraps a position back into the loop [start, start + length). */
export function wrap(x: number, start: number, length: number): number {
  const offset = (((x - start) % length) + length) % length;
  return start + offset;
}

/** Distance over which an object fades out as it nears the field's left or right border. */
export const EDGE_FADE = 60;

/**
 * Opacity of an object centred at `x` with half-width `halfWidth`: fully visible inside the
 * field, fading to 0 by the time its edge touches the border, so no part of it is
 * ever drawn outside the field's frame while it wraps around.
 */
export function edgeAlpha(x: number, halfWidth: number, left: number, right: number): number {
  const room = Math.min(x - left, right - x) - halfWidth;
  return Math.min(1, Math.max(0, room / EDGE_FADE));
}
