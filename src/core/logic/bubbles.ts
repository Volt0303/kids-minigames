/**
 * Rising air bubbles for underwater backgrounds. Plain maths, no rendering:
 * the UI layer owns one `Bubble` per sprite and re-spawns it in place (no allocation).
 *
 * What makes them look natural:
 * - many small bubbles, few large ones (size skewed towards small);
 * - larger bubbles rise faster and sway wider;
 * - some bubbles rise in streams from fixed points on the sea floor ("vents");
 * - they fade in near the bottom and fade out near the top.
 */

export type Random = () => number;

export interface Bubble {
  /** Centre line the bubble sways around (design units). */
  baseX: number;
  y: number;
  radius: number;
  /** Rise speed in design units per second. */
  speed: number;
  /** Horizontal sway amplitude and frequency. */
  sway: number;
  swayHz: number;
  /** Sway phase in radians, so neighbours do not move in step. */
  phase: number;
  /** Opacity at full visibility. */
  opacity: number;
}

export interface BubbleArea {
  width: number;
  /** Where bubbles appear (just below the screen) and disappear (just above it). */
  bottom: number;
  top: number;
  /** x positions of the streams on the sea floor. */
  vents: readonly number[];
}

export const MIN_RADIUS = 7;
export const MAX_RADIUS = 46;
const VENT_SHARE = 0.35;
const VENT_JITTER = 14;
const VENT_MAX_RADIUS = 18;
/** One bubble per this many design units of screen width. */
const WIDTH_PER_BUBBLE = 70;
export const MAX_BUBBLES = 56;
/** Distance over which a bubble fades in (bottom) and out (top). */
const FADE_IN = 120;
const FADE_OUT_SHARE = 0.18;

const between = (random: Random, min: number, max: number): number => min + (max - min) * random();

export function bubbleCount(width: number): number {
  return Math.min(MAX_BUBBLES, Math.max(8, Math.round(width / WIDTH_PER_BUBBLE)));
}

/** Evenly spread vents with some randomness; at least two. */
export function ventPositions(width: number, random: Random): number[] {
  const count = Math.max(2, Math.round(width / 900));
  const slot = width / count;
  return Array.from({ length: count }, (_, i) => slot * (i + between(random, 0.25, 0.75)));
}

/**
 * Gives `bubble` a new random size, speed and start position (in place).
 * `scatter` starts it anywhere on screen instead of at the bottom — used once
 * at the start so the screen is not empty while the first bubbles rise.
 */
export function spawnBubble(bubble: Bubble, area: BubbleArea, random: Random, scatter = false): void {
  const vent =
    area.vents.length > 0 && random() < VENT_SHARE ? area.vents[Math.floor(random() * area.vents.length)] : undefined;
  const sizeRoll = random() ** 2.2;
  const maxRadius = vent === undefined ? MAX_RADIUS : VENT_MAX_RADIUS;

  bubble.radius = MIN_RADIUS + (maxRadius - MIN_RADIUS) * sizeRoll;
  bubble.baseX =
    vent === undefined ? between(random, 0, area.width) : vent + between(random, -VENT_JITTER, VENT_JITTER);
  bubble.y = scatter ? between(random, area.top, area.bottom) : area.bottom + between(random, 0, 200);
  bubble.speed = 40 + bubble.radius * 2.6 + between(random, -10, 10);
  bubble.sway = 3 + bubble.radius * 0.45;
  bubble.swayHz = between(random, 0.35, 0.9);
  bubble.phase = between(random, 0, Math.PI * 2);
  bubble.opacity = between(random, 0.7, 1);
}

export function createBubble(area: BubbleArea, random: Random, scatter = false): Bubble {
  const bubble: Bubble = { baseX: 0, y: 0, radius: MIN_RADIUS, speed: 0, sway: 0, swayHz: 0, phase: 0, opacity: 0 };
  spawnBubble(bubble, area, random, scatter);
  return bubble;
}

/** Moves the bubble up; re-spawns it at the bottom once it has left the top. */
export function stepBubble(bubble: Bubble, area: BubbleArea, seconds: number, random: Random): void {
  bubble.y -= bubble.speed * seconds;
  if (bubble.y < area.top - bubble.radius) spawnBubble(bubble, area, random);
}

export function bubbleX(bubble: Bubble, elapsedSeconds: number): number {
  return bubble.baseX + Math.sin(elapsedSeconds * bubble.swayHz * Math.PI * 2 + bubble.phase) * bubble.sway;
}

/** Opacity at the bubble's current height: fades in at the bottom and out towards the top. */
export function bubbleAlpha(bubble: Bubble, area: BubbleArea): number {
  const fadeIn = (area.bottom - bubble.y) / FADE_IN;
  const fadeOut = (bubble.y - area.top) / ((area.bottom - area.top) * FADE_OUT_SHARE);
  const visibility = Math.min(1, Math.max(0, Math.min(fadeIn, fadeOut)));
  return visibility * bubble.opacity;
}
