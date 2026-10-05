/**
 * Where trash appears and how it moves in 海のおそうじゲーム, and the fish lanes. Everything is
 * in fractions of the field (0–1), so a screen-size change keeps every object in its place.
 * Randomness is injected so tests can fix it.
 */
import { pick, type Random } from '../../../core/logic/random';

export interface TrashMotion {
  /** Centre across the field (0 = left, 1 = right). */
  x: number;
  /** Height where it appears, and where it comes to rest on the sea floor. */
  startY: number;
  restY: number;
  /** Phase of its gentle side-to-side sway, so pieces do not move in step. */
  phase: number;
}

/** Trash keeps away from the field's sides, the top (behind the surface) and the sand line. */
const X_MIN = 0.1;
const X_MAX = 0.9;
const START_Y = 0.12;
/** Trash sinks all the way and rests on the sand at the bottom of the sea picture (centre height). */
const REST_MIN = 0.8;
const REST_MAX = 0.86;
/** Two pieces of trash are at least this far apart across the field (when there is room). */
const MIN_GAP = 0.16;
/** Candidate positions checked across the field. */
const STEPS = 33;

/**
 * A new piece of trash: at a random spot at least MIN_GAP from the others, or, if there is no
 * such spot, at the most open one — so two never sit on top of each other.
 */
export function spawnTrash(others: readonly number[], random: Random): TrashMotion {
  const candidates = Array.from({ length: STEPS }, (_, i) => X_MIN + ((X_MAX - X_MIN) * i) / (STEPS - 1));
  const gapAt = (x: number): number => others.reduce((closest, other) => Math.min(closest, Math.abs(other - x)), 1);
  const open = candidates.filter((x) => gapAt(x) >= MIN_GAP);
  if (open.length > 0) return motion(pick(open, random), random);
  const widest = candidates.reduce((best, x) => (gapAt(x) > gapAt(best) ? x : best), X_MIN);
  return motion(widest, random);
}

function motion(x: number, random: Random): TrashMotion {
  return { x, startY: START_Y, restY: REST_MIN + random() * (REST_MAX - REST_MIN), phase: random() * Math.PI * 2 };
}

/** Sway across the field (fraction of its width) and tilt (degrees). */
const SWAY = 0.012;
const TILT = 8;
const BOB = 0.008;

/**
 * Where a piece of trash is `seconds` after it appeared: it sinks at `sinkSpeed` (field
 * heights per second) until its resting height, swaying gently, then bobs there.
 */
export function trashPose(
  trash: TrashMotion,
  seconds: number,
  sinkSpeed: number,
): { x: number; y: number; angle: number } {
  const sunk = trash.startY + sinkSpeed * seconds;
  const settled = sunk >= trash.restY;
  const wave = Math.sin(trash.phase + seconds * 1.4);
  return {
    x: trash.x + SWAY * wave,
    y: settled ? trash.restY + BOB * Math.sin(trash.phase + seconds * 2) : sunk,
    angle: TILT * wave,
  };
}

/** Vertical centres of `count` fish lanes, spread over the open water (above the sand). */
export function laneHeights(count: number): number[] {
  const top = 0.2;
  const bottom = 0.78;
  if (count <= 1) return [(top + bottom) / 2];
  return Array.from({ length: count }, (_, i) => top + ((bottom - top) * i) / (count - 1));
}
