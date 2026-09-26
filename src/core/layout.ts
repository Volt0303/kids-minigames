/**
 * Screen layout rules shared by every game.
 * Plain TypeScript (no Phaser) so it can be unit-tested.
 */

export type LayoutMode = 'wide' | 'standard';

/** Aspect ratio at or above which the wide layout is used (1920x540 = 3.56). */
export const WIDE_RATIO = 2.4;

export function getLayoutMode(width: number, height: number): LayoutMode {
  return width / height >= WIDE_RATIO ? 'wide' : 'standard';
}

/** Minimum touch target size in pixels for the current screen height (~13%). */
export function minTouchSize(height: number): number {
  return Math.round(height * 0.13);
}
